import { useEffect, useRef } from "react";
import { Quote } from "../../common/types";

type AdminQuotesProps = {
  currentQuote: Quote | null;
  allQuotes: Quote[];
  handleStartGame: () => void;
  isStarting: boolean;
};

export const AdminQuotes: React.FC<AdminQuotesProps> = ({
  currentQuote,
  allQuotes,
  handleStartGame,
  isStarting,
}) => {
  const quotesContainerRef = useRef<HTMLDivElement>(null);

  // Using the text of the quote as the dependency for the useEffect because
  // objects always appear to change. It's easier to compare the string. This
  // stops the scroll from happening on every clock tick from the server.
  const quote = currentQuote?.quote;
  useEffect(() => {
    if (quote && quotesContainerRef.current) {
      const currentQuoteElement =
        quotesContainerRef.current.querySelector(".border-ds-primary");
      if (currentQuoteElement) {
        (currentQuoteElement as HTMLDivElement).scrollIntoView({
          block: "end",
          inline: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [quote]);

  return (
    <div className="grid gap-4">
      <h2 className="text-4xl font-semibold">Quotes</h2>
      {allQuotes.length === 0 ? (
        <div className="border border-neutral-800 p-4 rounded grid gap-2 items-center justify-center">
          <span>No quotes yet.</span>
          <button
            onClick={handleStartGame}
            disabled={isStarting}
            className="bg-white disabled:bg-neutral-800 text-black font-bold py-2 px-4 rounded"
          >
            {isStarting ? "Starting..." : "Start Game"}
          </button>
        </div>
      ) : (
        <div className="overflow-y-auto h-96">
          <div ref={quotesContainerRef} className="flex flex-col">
            {allQuotes.map((quote, index) => (
              <div
                key={index}
                className={`border grid gap-4 p-4 content-start rounded ${
                  currentQuote && currentQuote.quote === quote.quote
                    ? "border-2 border-ds-primary"
                    : "border-neutral-800"
                }`}
              >
                <p className="font-bold">&ldquo;{quote.quote}&rdquo;</p>
                {currentQuote && currentQuote.quote === quote.quote && (
                  <ul className="list-disc list-outside px-4">
                    {quote.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className={
                          optionIndex === quote.correctOptionIndex
                            ? "text-ds-quaternary font-bold"
                            : ""
                        }
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
