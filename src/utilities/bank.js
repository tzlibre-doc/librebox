const fetch = window.fetch

export const retrieveBalanceByAddress = (address) => {
  return fetch(
    'https://www.tzlibre.io/api/v1/depositors',
    {
      'headers': { 'content-type': 'application/json' },
      'method': 'GET',
      'mode': 'cors'
    })
    .then(r => r.json())
    .then(data => {
      if (data[address]) {
        return Math.floor(parseInt(data[address]) / 1000000)
      }
      return 0
    })
}
