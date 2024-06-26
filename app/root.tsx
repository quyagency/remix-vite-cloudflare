import '~/assets/css/style.css';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { MantineProvider } from '@mantine/core';
import { json } from '@remix-run/cloudflare';
import { Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from '@remix-run/react';
import md from 'is-mobile';
import { promiseHash } from 'remix-utils/promise';
import { Document, ErrorBoundary as GeneralErrorBoundary, TheFooter, TheHeader } from '~/components';
import { useProgress } from '~/hooks';
import { getUrl } from '~/utils';
import { http0 } from '~/utils/.server';

export { headers, meta } from '~/utils/meta';
export const shouldRevalidate = () => false;
export const useRootLoaderData = () => useRouteLoaderData<typeof loader>('root');
export const loader = async ({ request: { headers } }: LoaderFunctionArgs) => {
  const ua = headers.get('user-agent') as string;
  const isMobile = md({ ua, tablet: true });
  const isPhone = md({ ua });
  const isTablet = isMobile && !isPhone;
  const isDesktop = !isMobile;

  const data = await promiseHash({
    primaryMenu: http0.get<iMenu>('/menus/v1/menus/primary'),
    // footer: http0.get<iMenu>('/menus/v1/menus/footer'),
    // socials: http0.get<iMenu>('/menus/v1/menus/socials'),
  });

  return json(
    {
      isMobile,
      isPhone,
      isTablet,
      isDesktop,
      menu: {
        primary: data?.primaryMenu?.data?.items?.map(({ url, title }) => ({ title, path: getUrl(url) })),
        // footer: menu?.footer?.items?.map(({ url, title }) => ({ title, path: getUrl(url) })),
        // socials: menu?.socials?.items?.map(({ url }) => ({ url })),
      },
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  );
};

export default function App() {
  useProgress();

  return (
    <Document>
      <MantineProvider>
        <TheHeader />
        <Outlet />
        <TheFooter />
      </MantineProvider>
      <ScrollRestoration />
      <Scripts />
    </Document>
  );
}

export const ErrorBoundary = () => (
  <Document>
    <GeneralErrorBoundary />
  </Document>
);
