import { ProfileType } from "@shared/helpers/dataType";
import { SLUG_PROFILE } from "@shared/helpers/slugs";

const PROFILES = Object.freeze({
  [SLUG_PROFILE.CITIZEN]: 'Persona Natural',
  [SLUG_PROFILE.PNP]: 'Policía Nacional del Perú',
  [SLUG_PROFILE.PJ]: 'Poder Judicial',
  [SLUG_PROFILE.ENTITY]: 'Entidad',
})

export function profileDescription(profile: ProfileType) {
  return PROFILES[profile]
}