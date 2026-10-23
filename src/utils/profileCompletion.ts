import { User } from '../types';

export interface ProfileCompletionField {
  key: string;
  label: string;
  done: boolean;
}

// Even weighting across fields that matter for matching + account linking —
// email only counts once it's actually verified, since an unverified email
// can't safely be used to link a later Google/Apple sign-in.
export function getProfileCompletion(user: User | null | undefined): {
  percent: number;
  fields: ProfileCompletionField[];
} {
  const fields: ProfileCompletionField[] = [
    { key: 'name', label: 'Name', done: !!user?.name?.trim() },
    { key: 'dob', label: 'Date of birth', done: !!user?.dob || !!user?.age },
    { key: 'gender', label: 'Gender', done: !!user?.gender },
    { key: 'city', label: 'Location', done: !!user?.city },
    { key: 'email', label: 'Verified email', done: !!user?.email && !!user?.emailVerified },
    { key: 'interests', label: 'Activities', done: (user?.interests?.length || 0) >= 2 },
    { key: 'photo', label: 'Profile photo', done: !!user?.photoURL },
  ];
  const doneCount = fields.filter((f) => f.done).length;
  const percent = Math.round((doneCount / fields.length) * 100);
  return { percent, fields };
}
