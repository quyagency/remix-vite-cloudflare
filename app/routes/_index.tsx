import { useLoaderData } from '@remix-run/react';
import { Icon } from '~/components';
import { getPage } from '~/utilities/.server';

export const loader = async () => await getPage('home');

export { headers, meta } from '~/utilities/meta';

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="container flex h-screen items-center justify-center">
      <h1 className="text-blue-500">Welcome to Remix</h1>
      <Icon name="accessibility" className="h-12 text-red-500" />
    </div>
  );
}
