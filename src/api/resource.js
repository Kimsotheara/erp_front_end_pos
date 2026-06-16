import http from './http'

// Normalise a Spring `Page` response into { items, total, pageNumber, size }.
export function normalizePage(body) {
  if (Array.isArray(body)) {
    return { items: body, total: body.length, pageNumber: 1, size: body.length }
  }
  if (body && Array.isArray(body.content)) {
    return {
      items: body.content,
      total: body.totalElements ?? body.content.length,
      pageNumber: (body.number ?? 0) + 1,
      size: body.size ?? body.content.length,
      totalPages: body.totalPages,
    }
  }
  if (body && Array.isArray(body.items)) {
    return {
      items: body.items,
      total: body.total ?? body.items.length,
      pageNumber: body.pageNumber ?? 1,
      size: body.size ?? body.items.length,
      totalPages: body.totalPages,
    }
  }
  return { items: [], total: 0, pageNumber: 1, size: 10 }
}

// Generic REST resource bound to a base path, e.g. createResource('/products').
export function createResource(basePath) {
  return {
    async list(params = {}) {
      const body = await http.get(basePath, {
        params: {
          pageNumber: params.pageNumber ?? 1,
          size: params.size ?? 10,
          sortProperty: params.sortProperty ?? 'id',
          sortDirection: params.sortDirection ?? 'desc',
          ...params.extra,
        },
      })
      return normalizePage(body)
    },
    get(id) {
      return http.get(`${basePath}/${id}`)
    },
    create(payload) {
      return http.post(basePath, payload)
    },
    update(id, payload) {
      return http.put(`${basePath}/${id}`, payload)
    },
    remove(id) {
      return http.delete(`${basePath}/${id}`)
    },
  }
}
