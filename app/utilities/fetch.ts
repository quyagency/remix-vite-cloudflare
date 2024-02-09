import { json, redirect } from '@remix-run/cloudflare';
import queryString from 'query-string';
import { omit, reject } from 'ramda';
import { isNilOrEmpty } from 'ramda-adjunct';
import { trailingSlash } from '~/utilities';

const init = { headers: { 'Cache-Control': 'public, max-age=300' } };

export async function rawFetch(url: string, options?: { params?: object; accessToken?: string }) {
  const uri = url?.startsWith('http') ? url : `${import.meta.env.VITE_HOST}/wp-json/${trailingSlash(url)}`;
  const query = options?.params ? '?' + queryString.stringify(reject(isNilOrEmpty)(options.params)) : '';
  const requestInitr = options?.accessToken ? { headers: { Authorization: `Basic ${options?.accessToken}` } } : undefined;

  const response = await fetch(uri + query, requestInitr);

  const data = await response.text();

  if (isNilOrEmpty(data)) return {};

  return JSON.parse(data);
}

export async function getPage(slug?: string, locale = 'en') {
  let data: iRawPage;
  const options = { params: { slug: slug === 'index' ? 'home' : slug, __embed: true, acf_format: 'standard', lang: locale } };
  const [tempData]: iRawPage[] = await rawFetch('/wp/v2/pages', options);
  // eslint-disable-next-line prefer-const
  data = tempData;

  if (data?.acf?.blocks) {
    let jobs: any[] = [];
    if (data?.acf?.blocks?.find(({ acf_fc_layout }) => ['hr_page'].includes(acf_fc_layout))) {
      const data = (await getJobs(locale)) as unknown as iRawJob[];
      jobs = data.map(({ title, slug, acf: { description, department, expire, location, position } }) => ({
        title: title.rendered?.replace('&#038;', '&'),
        slug,
        description,
        department,
        expire,
        location,
        position,
      }));
    }
    const posts: any[] = [];
    if (data?.acf?.blocks?.find(({ acf_fc_layout }) => ['news', 'news_center'].includes(acf_fc_layout))) {
      const data = (await getPosts(locale)) as unknown as iRawPost[];
      for (const { title, excerpt, link, _embedded } of data) {
        posts.push({
          title: title.rendered?.replace('&#038;', '&'),
          excerpt: excerpt.rendered,
          link,
          featured_media: _embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.medium_large?.source_url,
        });
      }
    }
    return json(
      {
        blocks: data?.acf?.blocks?.map((item) => {
          if (['news', 'news_center'].includes(item.acf_fc_layout)) return { ...item, items: posts };
          if (['hr_page'].includes(item.acf_fc_layout)) return { ...item, items: jobs };
          return item;
        }),
        title: data?.title.rendered?.replace('&#038;', '&'),
        yoast_head_json: omit(['schema', 'og_url'], data?.yoast_head_json),
      },
      init,
    );
  }

  return redirect('/404');
}

export async function getPosts(locale = 'en') {
  const data = await rawFetch('/wp/v2/posts', { params: { __embed: true, acf_format: 'standard', lang: locale } });
  if (data) return json(data, init);
  return redirect('/404');
}

export async function getPost(slug?: string, locale = 'en') {
  if (!slug) return null;
  const [data] = await rawFetch(`/wp/v2/posts`, { params: { slug, __embed: true, acf_format: 'standard', lang: locale } });
  if (data) return json(data, init);
  return redirect('/404');
}

export async function getJobs(locale = 'en') {
  const data = await rawFetch('/wp/v2/jobs', { params: { __embed: true, acf_format: 'standard', lang: locale } });
  if (data) return json(data, init);
  return redirect('/404');
}

export async function getJob(slug?: string, locale = 'en') {
  if (!slug) return null;
  const [data] = await rawFetch('/wp/v2/jobs', { params: { slug, __embed: true, acf_format: 'standard', lang: locale } });
  if (data) return json(data, init);
  return redirect('/404');
}
