import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  View, Modal, SafeAreaView, Text, Button, ActivityIndicator, StyleSheet,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// Vendored from expo-firebase-recaptcha (FirebaseRecaptcha.js + FirebaseRecaptchaVerifierModal.js)
// as a plain WebView loading Firebase's own hosted recaptcha widget — no native
// module involved. The npm package pulled in expo-firebase-core purely for an
// unused default-config fallback (we always pass firebaseConfig explicitly),
// but expo-firebase-core's iOS podspec pinned an old Firebase SDK version that
// conflicted with @react-native-firebase's native modules. Vendoring the ~150
// lines of actual logic here avoids that dependency entirely.

interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  [key: string]: any;
}

export interface FirebaseRecaptchaVerifierHandle {
  type: 'recaptcha';
  verify: () => Promise<string>;
}

interface Props {
  firebaseConfig: FirebaseConfig;
  firebaseVersion?: string;
  appVerificationDisabledForTesting?: boolean;
  languageCode?: string;
  attemptInvisibleVerification?: boolean;
  title?: string;
  cancelLabel?: string;
}

function getWebviewSource(
  firebaseConfig: FirebaseConfig,
  firebaseVersion: string,
  appVerificationDisabledForTesting: boolean,
  languageCode: string | undefined,
  invisible: boolean,
) {
  return {
    baseUrl: `https://${firebaseConfig.authDomain}`,
    html: `
<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="HandheldFriendly" content="true">
  <script src="https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js"></script>
  <script type="text/javascript">firebase.initializeApp(${JSON.stringify(firebaseConfig)});</script>
  <style>
    html, body { height: 100%; ${invisible ? 'padding: 0; margin: 0;' : ''} }
    #recaptcha-btn { width: 100%; height: 100%; padding: 0; margin: 0; border: 0; user-select: none; -webkit-user-select: none; }
  </style>
</head>
<body>
  ${invisible
        ? `<button id="recaptcha-btn" type="button" onclick="onClickButton()">Confirm reCAPTCHA</button>`
        : `<div id="recaptcha-cont" class="g-recaptcha"></div>`}
  <script>
    var fullChallengeTimer;
    function onVerify(token) {
      if (fullChallengeTimer) { clearInterval(fullChallengeTimer); fullChallengeTimer = undefined; }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: token }));
    }
    function onLoad() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'load' }));
      firebase.auth().settings.appVerificationDisabledForTesting = ${appVerificationDisabledForTesting};
      ${languageCode ? `firebase.auth().languageCode = '${languageCode}';` : ''}
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier("${invisible ? 'recaptcha-btn' : 'recaptcha-cont'}", {
        size: "${invisible ? 'invisible' : 'normal'}",
        callback: onVerify
      });
      window.recaptchaVerifier.render();
    }
    function onError() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error' }));
    }
    function onClickButton() {
      if (!fullChallengeTimer) {
        fullChallengeTimer = setInterval(function() {
          var iframes = document.getElementsByTagName("iframe");
          var isFullChallenge = false;
          for (i = 0; i < iframes.length; i++) {
            var parentWindow = iframes[i].parentNode ? iframes[i].parentNode.parentNode : undefined;
            var isHidden = parentWindow && parentWindow.style.opacity == 0;
            isFullChallenge = isFullChallenge || (
              !isHidden &&
              ((iframes[i].title === 'recaptcha challenge') ||
               (iframes[i].src.indexOf('google.com/recaptcha/api2/bframe') >= 0)));
          }
          if (isFullChallenge) {
            clearInterval(fullChallengeTimer);
            fullChallengeTimer = undefined;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullChallenge' }));
          }
        }, 100);
      }
    }
    window.addEventListener('message', function(event) {
      if (event.data.verify) { document.getElementById('recaptcha-btn').click(); }
    });
  </script>
  <script src="https://www.google.com/recaptcha/api.js?onload=onLoad&render=explicit&hl=${languageCode ?? ''}" onerror="onError()"></script>
</body></html>`,
  };
}

const FirebaseRecaptchaVerifier = forwardRef<FirebaseRecaptchaVerifierHandle, Props>((props, ref) => {
  const {
    firebaseConfig, firebaseVersion = '8.0.0', appVerificationDisabledForTesting = false,
    languageCode, attemptInvisibleVerification = false, title = 'reCAPTCHA', cancelLabel = 'Cancel',
  } = props;

  const invisibleWebview = useRef<WebView>(null);
  const visibleWebview = useRef<WebView>(null);
  const pending = useRef<{ resolve: (token: string) => void; reject: (err: Error) => void } | null>(null);

  const [visible, setVisible] = useState(false);
  const [visibleLoaded, setVisibleLoaded] = useState(false);
  const [invisibleLoaded, setInvisibleLoaded] = useState(false);
  const [invisibleVerify, setInvisibleVerify] = useState(false);
  const [invisibleKey, setInvisibleKey] = useState(1);

  useEffect(() => {
    if (invisibleWebview.current && invisibleLoaded && invisibleVerify) {
      invisibleWebview.current.injectJavaScript(`
        (function(){ window.dispatchEvent(new MessageEvent('message', {data: { verify: true }})); })();
        true;
      `);
    }
  }, [invisibleLoaded, invisibleVerify]);

  const onVerify = (token: string) => {
    pending.current?.resolve(token);
    pending.current = null;
    setVisible(false);
    setInvisibleVerify(false);
    setInvisibleLoaded(false);
    setInvisibleKey((k) => k + 1);
  };

  const onError = () => {
    pending.current?.reject(new Error('Failed to load reCAPTCHA'));
    pending.current = null;
    setVisible(false);
    setInvisibleVerify(false);
  };

  const onFullChallenge = () => {
    setInvisibleVerify(false);
    setVisible(true);
  };

  const cancel = () => {
    pending.current?.reject(new Error('Cancelled by user'));
    pending.current = null;
    setVisible(false);
  };

  const handleMessage = (onLoadCb: () => void) => (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);
    switch (data.type) {
      case 'load': onLoadCb(); break;
      case 'error': onError(); break;
      case 'verify': onVerify(data.token); break;
      case 'fullChallenge': onFullChallenge(); break;
    }
  };

  useImperativeHandle(ref, () => ({
    type: 'recaptcha' as const,
    verify: () => new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
      if (attemptInvisibleVerification) {
        setInvisibleVerify(true);
      } else {
        setVisible(true);
        setVisibleLoaded(false);
      }
    }),
  }));

  return (
    <View style={styles.container}>
      {attemptInvisibleVerification && (
        <WebView
          key={`invisible${invisibleKey}`}
          ref={invisibleWebview}
          style={styles.invisible}
          javaScriptEnabled
          automaticallyAdjustContentInsets
          scalesPageToFit
          mixedContentMode="always"
          source={getWebviewSource(firebaseConfig, firebaseVersion, appVerificationDisabledForTesting, languageCode, true)}
          onError={onError}
          onMessage={handleMessage(() => setInvisibleLoaded(true))}
        />
      )}
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={cancel}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.cancel}>
              <Button title={cancelLabel} onPress={cancel} />
            </View>
          </View>
          <View style={styles.content}>
            <WebView
              ref={visibleWebview}
              style={styles.content}
              javaScriptEnabled
              automaticallyAdjustContentInsets
              scalesPageToFit
              mixedContentMode="always"
              source={getWebviewSource(firebaseConfig, firebaseVersion, appVerificationDisabledForTesting, languageCode, false)}
              onError={onError}
              onMessage={handleMessage(() => setVisibleLoaded(true))}
            />
            {!visibleLoaded && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" />
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
});

export default FirebaseRecaptchaVerifier;

const styles = StyleSheet.create({
  container: { width: 0, height: 0 },
  invisible: { width: 300, height: 300 },
  modalContainer: { flex: 1 },
  header: {
    backgroundColor: '#FBFBFB', height: 44, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    borderBottomColor: '#CECECE', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: { position: 'absolute', left: 8, justifyContent: 'center' },
  title: { fontWeight: 'bold' },
  content: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, paddingTop: 20, justifyContent: 'flex-start', alignItems: 'center' },
});
