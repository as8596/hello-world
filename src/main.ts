import Phaser from 'phaser';
import { gameConfig } from './config';

/** Entry point: boot the Phaser game with our config. */
export const game = new Phaser.Game(gameConfig);
