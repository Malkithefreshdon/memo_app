export default defineEventHandler(async (event) => {
  const { id, watchIp } = await readBody<{ id: string; watchIp: string }>(event)

  if (!id || !watchIp) {
    throw createError({ statusCode: 400, message: 'id et watchIp requis' })
  }

  const url = id === '__stop__'
    ? `http://${watchIp}/stop`
    : `http://${watchIp}/guide?id=${encodeURIComponent(id)}`

  await $fetch(url, { timeout: 3000 }).catch((e: any) => {
    throw createError({ statusCode: 502, message: `Montre injoignable (${e?.cause?.code ?? e?.message})` })
  })

  return { ok: true, id, watchIp }
})
