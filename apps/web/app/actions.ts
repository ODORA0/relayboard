'use server';

export async function registerCsv(name: string, csvUrl: string) {
  const res = await fetch(process.env.API_BASE_URL + '/v1/datasets/csv', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, csvUrl })
  });
  return res.json();
}

export async function setSlack(webhookUrl: string) {
  const res = await fetch(process.env.API_BASE_URL + '/v1/destinations/slack', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ webhookUrl })
  });
  return res.json();
}

export async function runPipeline(datasetName: string) {
  const res = await fetch(process.env.API_BASE_URL + '/v1/pipelines/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ datasetName })
  });
  return res.json();
}
