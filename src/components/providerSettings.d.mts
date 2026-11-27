import type { ProviderConfig } from '../types';
export const PROVIDER_STORAGE_KEY: string;
export const LEGACY_SECRET_STORAGE_KEYS: readonly string[];
export function safeServiceUrl(value: unknown): string;
export function sanitizeProviders(records: unknown, defaults?: ProviderConfig[]): ProviderConfig[];
export function migrateProviderSettings(storage: Storage, defaults?: ProviderConfig[]): ProviderConfig[];
