// Modelo de dominio. Importes en unidades enteras de la moneda original
// (ej: COP 25900 = $25.900). La conversión a la moneda de visualización la
// hacen los helpers de composables/useDatos.

export interface Gasto {
  id: string
  folio: number
  amount: number
  currency: string
  category: string
  note: string
  date: Date
  createdAt: Date
}

export interface Categoria {
  id: string
  label: string
  icon: string
  color: string
  sort: number
}

export interface MonedaInfo {
  code: string
  label: string
  symbol: string
}

export interface Usuario {
  name: string
  email: string
  photo: string | null
}
