import { NextUIProvider } from '@nextui-org/react';
import { json, LoaderFunction } from '@remix-run/node';
import { isRouteErrorResponse, LiveReload, Outlet, Scripts, ScrollRestoration, useLoaderData, useNavigate, useRouteError } from '@remix-run/react';
import md from 'is-mobile';
import { promiseHash } from 'remix-utils/promise';
import { Document } from '~/components';
import { getUrl, isDev } from '~/utilities';
import { rawFetch } from '~/utilities/fetch';
import '~/assets/css/style.css';
import { useProgress } from '~/hooks';

export { headers } from '~/utilities/meta';

export const loader: LoaderFunction = async ({ request: { headers } }) => {
  const ua = headers.get('user-agent') as string;
  const isMobile = md({ ua, tablet: true });
  const isPhone = md({ ua });
  const isTablet = isMobile && !isPhone;
  const isDesktop = !isMobile;

  const menu = await promiseHash({
    primary: rawFetch('/menus/v1/menus/primary'),
    footer: rawFetch('/menus/v1/menus/footer'),
    socials: rawFetch('/menus/v1/menus/socials'),
  });

  return json(
    {
      isMobile,
      isPhone,
      isTablet,
      isDesktop,
      menu: {
        // @ts-ignore
        primary: menu?.primary?.items?.map(({ url, title }) => ({ title, path: getUrl(url) })),
        // @ts-ignore
        footer: menu?.footer?.items?.map(({ url, title }) => ({ title, path: getUrl(url) })),
        // @ts-ignore
        socials: menu?.socials?.items?.map(({ url }) => ({ url })),
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
};

export default function App() {
  useProgress();
  const navigate = useNavigate();
  const settings = useLoaderData<iSettings>();

  return (
    <Document>
      <NextUIProvider navigate={navigate}>
        <Outlet context={settings} />
      </NextUIProvider>
      <ScrollRestoration />
      <Scripts />
      {isDev && <LiveReload />}
    </Document>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <Document title={`${error.status} ${error.statusText}`}>
        <div className="prose container flex h-screen min-w-full items-center justify-center">
          <div>
            <h1>
              {error.status} {error.statusText}
            </h1>
            <p>{error.data}</p>
          </div>
        </div>
      </Document>
    );
  } else if (error instanceof Error) {
    return (
      <Document title="Error">
        <div className="prose container flex h-screen min-w-full items-center justify-center">
          <div>
            <h1>Error</h1>
            <p>{error.message}</p>
            <p>The stack trace is:</p>
            <pre>{error.stack}</pre>
          </div>
        </div>
      </Document>
    );
  } else {
    return (
      <Document title="Unknown Error">
        <h1>Unknown Error</h1>
      </Document>
    );
  }
}
