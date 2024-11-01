import type { Quote } from "../../../common/types";

/**
 * This function gets an array of quotes like so:
 * [
 *  {
 *    "quote": "This is a quote",
 *    "options": ["Option 1", "Option 2", "Option 3"],
 *    "correctOptionIndex": 1
 *  }
 * ]
 *
 * It ensures that the correctOptionIndex is always within the bounds of
 * the total number of players playing, and that the correct option
 * matches the index of the correct answer.
 *
 * @param quotes - The array of quotes to ensure the correct answer is in the options set
 * @param totalPlayers - The total number of players playing
 * @returns The array of quotes with the correct answer in the options set
 */
export const ensureCorrectAnswerInClampedOptionset = (
  quotes: Array<Quote>,
  totalPlayers: number
) => {
  return quotes.map((quote) => {
    // Get the correct option value
    const correctOption = quote.options[quote.correctOptionIndex];

    // Create new options array clamped to totalPlayers length
    const clampedOptions = [...quote.options].slice(0, totalPlayers);

    // Find where the correct option is in the clamped array
    const correctOptionInClampedArray = clampedOptions.indexOf(correctOption);

    // If correct option was cut off, put it back in at a random valid index
    if (correctOptionInClampedArray === -1) {
      const randomIndex = Math.floor(Math.random() * totalPlayers);
      clampedOptions[randomIndex] = correctOption;
      return {
        ...quote,
        options: clampedOptions,
        correctOptionIndex: randomIndex,
      };
    }

    // Otherwise keep the correct option where it naturally fell
    return {
      ...quote,
      options: clampedOptions,
      correctOptionIndex: correctOptionInClampedArray,
    };
  });
};
