export const fetchUsers = async (query, page = 0) => {
  return await fetch('https://UYFAS89LW0-dsn.algolia.net/1/indexes/users/query', {
    method: 'POST',
    body: JSON.stringify({
      query,
      facets: ['*'],
      page
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-algolia-application-id': 'UYFAS89LW0',
      'x-algolia-api-key': 'db16b1118a75abf483da00b135870432'
    }
  });
};
