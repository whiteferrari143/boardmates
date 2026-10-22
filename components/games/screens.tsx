import type {ComponentType} from 'react';
import {CrystalMarket} from './CrystalMarket';
import {Spyfall} from './Spyfall';
import {Deception} from './Deception';
import type {GameScreenProps} from './types';
export const gameScreens:Record<string,ComponentType<GameScreenProps>>={'crystal-market':CrystalMarket,spyfall:Spyfall,deception:Deception};
