export const AI_CHARACTERS = {
  alfred: { avatar: require('../../assets/characters/avatar-alfred.png'), bubble: '#302A1C', border: '#C5A45D' },
  mimi: { avatar: require('../../assets/characters/avatar-mimi.png'), bubble: '#20362D', border: '#BBA65C' },
  pawlmer: { avatar: require('../../assets/characters/avatar-pawlmer.png'), bubble: '#3A291F', border: '#D89A61' },
};
export const getAICharacter = key => AI_CHARACTERS[key] || AI_CHARACTERS.alfred;
