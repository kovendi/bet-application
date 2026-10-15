// Classic script (not a module). EF_004: quiz with feedback after every
// answer and a score at the end. Needs i18n, icon, button, progress-bar,
// motion and education-shared loaded first.
//
// window.educationQuiz.renderQuiz(item) -> element; item.questions is
// [{ q, options, correct, explain }].

window.educationQuiz = (function () {
  const t = window.i18n.t;
  const GOOD_SCORE_RATIO = 0.7;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderQuiz(item) {
    const root = element("div", "education-quiz");
    const total = item.questions.length;
    let index = 0;
    let score = 0;

    function show(node) {
      root.replaceChildren(node);
      window.motion.fadeIn(node);
    }

    // Best score so far (read before saving this run), shown under the result.
    function renderBest(previous, isNewBest) {
      if (isNewBest && previous) {
        const badge = element("p", "education-quiz-best education-quiz-best--new");
        badge.append(window.iconModule.renderIcon("star-filled"), document.createTextNode(t("edu.quiz_new_best")));
        return badge;
      }
      if (previous && !isNewBest) {
        return element("p", "education-quiz-best", t("edu.quiz_previous_best").replace("{score}", previous.score).replace("{total}", previous.total));
      }
      return null;
    }

    function renderResult() {
      const result = element("div", "education-quiz-result");
      const great = score / total >= GOOD_SCORE_RATIO;
      const previous = window.storage.getQuizBest(item.id);
      const isNewBest = window.storage.saveQuizScore(item.id, score, total);
      const best = renderBest(previous, isNewBest);
      result.append(
        element("h2", "education-quiz-result-title", t("edu.quiz_result_title")),
        element("p", "education-quiz-result-score", t("edu.quiz_result_score").replace("{score}", score).replace("{total}", total)),
        ...(best ? [best] : []),
        element("p", "education-article-text", t(great ? "edu.quiz_result_great" : "edu.quiz_result_ok")),
        window.buttonModule.renderButton({
          label: t("edu.quiz_retry"),
          variant: "primary",
          onClick: () => {
            index = 0;
            score = 0;
            renderQuestion();
          },
        }),
      );
      if (item.futam) {
        result.appendChild(window.buttonModule.renderButton({ label: t("edu.futam_open"), variant: "outline", onClick: window.educationShared.openFutam }));
      }
      show(result);
    }

    function renderQuestion() {
      const question = item.questions[index];
      const screen = element("div", "education-quiz-question");
      screen.appendChild(
        window.progressBarModule.renderProgressBar({
          label: t("edu.quiz_progress").replace("{current}", index + 1).replace("{total}", total),
          percent: (index / total) * 100,
          layout: "stacked",
          color: "accent",
        }),
      );
      screen.appendChild(element("h2", "education-quiz-text", question.q));

      const options = element("div", "education-quiz-options");
      const feedback = element("div", "education-quiz-feedback");
      feedback.setAttribute("aria-live", "polite");
      const buttons = question.options.map((label, optionIndex) => {
        const button = element("button", "education-quiz-option", label);
        button.type = "button";
        button.addEventListener("click", () => answer(optionIndex));
        return button;
      });
      options.append(...buttons);

      function mark(button, ok) {
        button.classList.add(ok ? "is-correct" : "is-wrong");
        button.appendChild(window.iconModule.renderIcon(ok ? "check" : "exclamationmark-circle"));
      }

      function answer(chosen) {
        buttons.forEach((button) => (button.disabled = true));
        const ok = chosen === question.correct;
        if (ok) score += 1;
        mark(buttons[chosen], ok);
        if (!ok) mark(buttons[question.correct], true);

        const isLast = index === total - 1;
        const verdict = element("p", "education-quiz-verdict " + (ok ? "is-correct" : "is-wrong"), t(ok ? "edu.quiz_correct" : "edu.quiz_wrong"));
        feedback.append(
          verdict,
          element("p", "education-article-text", question.explain),
          window.buttonModule.renderButton({
            label: t(isLast ? "edu.quiz_finish" : "edu.quiz_next"),
            variant: "primary",
            onClick: () => {
              index += 1;
              if (isLast) renderResult();
              else renderQuestion();
            },
          }),
        );
        window.motion.fadeIn(feedback);
      }

      screen.append(options, feedback);
      show(screen);
    }

    renderQuestion();
    return root;
  }

  return { renderQuiz };
})();
