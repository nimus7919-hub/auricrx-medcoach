import type { BodyView } from '../types';
import bonesBack from './bonesBack';
import bonesFront from './bonesFront';
import musclesBack from './musclesBack';
import musclesFront from './musclesFront';
import organsBack from './organsBack';
import organsFront from './organsFront';
import { SKIN_BACK, SKIN_FRONT } from './skin';
import type { ArtLayer, SkinArt } from './types';
import vesselsBack from './vesselsBack';
import vesselsFront from './vesselsFront';

export type { ArtLayer, ArtPath, SkinArt } from './types';

export const ART: Record<'muscles' | 'vessels' | 'bones' | 'organs', Record<BodyView, ArtLayer>> = {
  muscles: { front: musclesFront, back: musclesBack },
  vessels: { front: vesselsFront, back: vesselsBack },
  bones: { front: bonesFront, back: bonesBack },
  organs: { front: organsFront, back: organsBack },
};

export const SKIN: Record<BodyView, SkinArt> = { front: SKIN_FRONT, back: SKIN_BACK };
