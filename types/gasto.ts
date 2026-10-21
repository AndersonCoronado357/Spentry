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
  /** Gasto fijo que dejó este recibo en su quincena (sin valor = gasto del día a día). */
  fijo?: string | null
}

/** Gasto fijo: se repite en cada quincena. */
export interface Fijo {
  id: string
  label: string
  amount: number
  currency: string
  category: string
  sort: number
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
