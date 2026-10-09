import type {ComponentType} from 'react';
import {RoomTest} from './RoomTest';
import {Spyfall} from './Spyfall';
import {Deception} from './Deception';
import type {GameScreenProps} from './types';
export const gameScreens:Record<string,ComponentType<GameScreenProps>>={'room-test':RoomTest,spyfall:Spyfall,deception:Deception};
