export type Point = { x: number; y: number }

export type SavedUnit = {
  id: string
  name?: string
  imageDataUrl: string
  sourceImageDataUrl?: string
  polygon?: Point[]
  createdAt: string
}

export type SavedMeasurement = {
  id: string
  mode: 'length' | 'area'
  resultValue: number
  unitId?: string
  createdAt: string
  previewDataUrl?: string
}

const DB_NAME = 'nankobun-scale'
const DB_VERSION = 1
const UNIT_STORE = 'units'
const MEASUREMENT_STORE = 'measurements'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(UNIT_STORE)) db.createObjectStore(UNIT_STORE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(MEASUREMENT_STORE)) db.createObjectStore(MEASUREMENT_STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function listSavedUnits(): Promise<SavedUnit[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UNIT_STORE, 'readonly')
    const request = tx.objectStore(UNIT_STORE).getAll()
    request.onsuccess = () => resolve((request.result as SavedUnit[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    request.onerror = () => reject(request.error)
  })
}

export async function saveUnit(unit: SavedUnit): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UNIT_STORE, 'readwrite')
    tx.objectStore(UNIT_STORE).put(unit)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteUnit(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UNIT_STORE, 'readwrite')
    tx.objectStore(UNIT_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveMeasurement(measurement: SavedMeasurement): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEASUREMENT_STORE, 'readwrite')
    tx.objectStore(MEASUREMENT_STORE).put(measurement)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
