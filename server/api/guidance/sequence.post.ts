export default defineEventHandler(async (event) => {
  const { ids, watchIp } = await readBody<{ ids: string[]; watchIp: string }>(event)

  if (!ids?.length || !watchIp) {
    throw createError({ statusCode: 400, message: 'ids (array) et watchIp requis' })
  }

  await $fetch(`http://${watchIp}/sequence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
    timeout: 3000,
  }).catch((e: any) => {
    throw createError({ statusCode: 502, message: `Montre injoignable (${e?.cause?.code ?? e?.message})` })
  })

  return { ok: true, ids, watchIp }
})
