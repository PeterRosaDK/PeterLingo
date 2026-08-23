export const onRequestGet: PagesFunction = async () =>
  new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Cache-Control': 'no-store',
    },
  });
