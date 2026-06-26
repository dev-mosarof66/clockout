import { Redirect } from 'expo-router';
import { useOnboarding } from '../lib/onboarding';

// Entry gate: returning (onboarded) users skip straight to the app; everyone
// else starts onboarding. Persisted state is already loaded by the time this
// renders (the root layout holds the splash until then).
export default function Index() {
  const { data } = useOnboarding();
  return <Redirect href={data.onboarded ? '/home' : '/welcome'} />;
}
