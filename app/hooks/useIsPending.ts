import { useFormAction, useNavigation } from '@remix-run/react';

/**
 * Use the current route's form action.
 * Checks if the current route's form is being submitted.
 *
 * @default formMethod is POST.
 * @default state is non-idle.
 */
export function useIsPending({ formAction, formMethod = 'POST', state = 'non-idle' }: iProps = {}) {
  const contextualFormAction = useFormAction();
  const navigation = useNavigation();
  const isPendingState = state === 'non-idle' ? navigation.state !== 'idle' : navigation.state === state;
  return isPendingState && navigation.formAction === (formAction ?? contextualFormAction) && navigation.formMethod === formMethod;
}

type iProps = {
  formAction?: string;
  formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  state?: 'submitting' | 'loading' | 'non-idle';
};
