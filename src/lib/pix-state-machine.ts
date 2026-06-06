import type { PixKeyType } from './pix-validation';
import { isValidPixKey } from './pix-validation';

export type PixPhase = 'idle' | 'generating' | 'ready' | 'analyzing' | 'error';

export interface PixMachineState {
  phase: PixPhase;
  type?: PixKeyType;
  value?: string;
  link?: string;
  error?: string;
}

export type PixEvent =
  | { type: 'SUBMIT'; pixType: PixKeyType; value: string }
  | { type: 'LINK_GENERATED'; link: string }
  | { type: 'ANALYSIS_DONE'; link: string }
  | { type: 'FAIL'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

/**
 * Pure reducer for the Pix flow state machine.
 * Enables headless unit testing without timers/Supabase.
 */
export function pixReducer(state: PixMachineState, event: PixEvent): PixMachineState {
  switch (event.type) {
    case 'SUBMIT': {
      if (!isValidPixKey(event.pixType, event.value)) {
        return { ...state, phase: 'error', error: 'Chave Pix inválida.' };
      }
      // CPF → direct link generation, others → analysis flow
      return {
        phase: event.pixType === 'cpf' ? 'generating' : 'generating',
        type: event.pixType,
        value: event.value,
      };
    }
    case 'LINK_GENERATED':
      return { ...state, phase: 'ready', link: event.link, error: undefined };
    case 'ANALYSIS_DONE':
      return { ...state, phase: 'ready', link: event.link, error: undefined };
    case 'FAIL':
      return { ...state, phase: 'error', error: event.error };
    case 'RETRY':
      if (!state.type || !state.value) return state;
      return { ...state, phase: 'generating', error: undefined };
    case 'RESET':
      return { phase: 'idle' };
    default:
      return state;
  }
}

/** Returns true only when the user may proceed to generate the biometric link. */
export function canGenerateLink(type: PixKeyType | '' | undefined, value: string): boolean {
  if (!type) return false;
  return isValidPixKey(type, value);
}