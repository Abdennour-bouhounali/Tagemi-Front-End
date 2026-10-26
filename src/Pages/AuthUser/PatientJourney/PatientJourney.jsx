import guideHtml from './patient-journey.html?raw';

// Interactive guide to the patient's visit (booking → queues → evaluation),
// for every signed-in user. It is a self-contained page, so it runs in a
// sandboxed frame. On phones it fills the space between the top bar and the
// tab bar, edge to edge, and scrolls on its own.
export default function PatientJourney() {
  return (
    <iframe
      title="رحلة المريض"
      srcDoc={guideHtml}
      sandbox="allow-scripts"
      className="block bg-white -mx-4 -mt-4 -mb-28 w-[calc(100%+2rem)] h-[calc(100dvh-3.5rem-4.125rem-env(safe-area-inset-bottom))] lg:m-0 lg:w-full lg:h-[calc(100dvh-7rem)] lg:rounded-2xl lg:border lg:border-line"
    />
  );
}
