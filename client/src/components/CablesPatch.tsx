import { useEffect, useState } from 'react';

interface CablesPatchProps {
  requestMatch: Function,
  leaveCall: Function,
  analyzerRemote: AnalyserNode | null,
  bufferLengthRemote: number,
  dataArrayRemote: Uint8Array | null,
  inCall: Boolean,
  error: {error: Boolean, message: String} | null,
  setError: Function
}

function CablesPatch({
  requestMatch,
  leaveCall,
  analyzerRemote,
  bufferLengthRemote,
  dataArrayRemote,
  inCall,
  error,
  setError
}: CablesPatchProps) {

  const [patchLoaded, setPatchLoaded] = useState<Boolean>(false);
  const [darkMode, setDarkMode] = useState<Boolean>(true);
  const [message, setMessage] = useState<String | null>(null)

  const canvasId = "glcanvas";
  const patchDir = '/patch/';

  /* Set up patch  */

  // Add the patch to the page, and initialize it
  useEffect(() => {
    const script = document.createElement('script');
    script.src = patchDir + '/js/patch.js';
    script.async = true;
    script.onload = initPatch;
    document.body.appendChild(script);

    // Initialization helper
    function initPatch () {
      CABLES.patch = new CABLES.Patch({
        patch: CABLES.exportedPatch,
        prefixAssetPath: patchDir,
        jsPath: patchDir + '/js',
        glCanvasId: canvasId,
        canvas: {'alpha': true, 'premultipliedAlpha': true},
        glCanvasResizeToWindow: true,
        onFinishedLoading: patchFinishedLoading,
      });
    }

    // Executed when the patch finished loading
    function patchFinishedLoading () {
      setPatchLoaded(true);
    }

    // Cleanup function
    return () => {
      document.body.removeChild(script);
    }
  }, [canvasId, patchDir]);

  /* Use effects */

  // When the remote stream analysis data is changed
  useEffect(() => {
    // Request an animation frame for itself,
    // calculate the average volume from the remote
    // stream data variables,
    // and pass its value to the patch
    const updateVolumeRemote = () => {
      if (analyzerRemote && dataArrayRemote) {
        requestAnimationFrame(updateVolumeRemote);

        analyzerRemote.getByteFrequencyData(dataArrayRemote);
        const avgVolume = dataArrayRemote.reduce((acc, curr) => acc + curr, 0) / bufferLengthRemote;
        CABLES.patch.setVariable("avgVolumeRemote", avgVolume);
      }
    };

    // Run the function for the first time (From then on,
    // it calls itself through the animation frame
    updateVolumeRemote();
  }, [analyzerRemote, bufferLengthRemote, dataArrayRemote])

  // Initialize the patch, when it finished loading
  useEffect(() => {
    if (patchLoaded) {
      // Make the canvas appear
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      canvas.style.opacity = '1';

      // Make the click box overlay work
      const clickBox = document.querySelector('.click-box') as HTMLDivElement;
      clickBox.style.cursor = 'pointer';

      // Initialize dark mode variable on patch
      CABLES.patch.setVariable('darkMode', darkMode);
    }
  }, [patchLoaded])

  // When the patch finished loading and inCall changes, pass its value to the patch
  useEffect(() => {
    if (patchLoaded) {
      CABLES.patch.setVariable('inCall', inCall);
      if (!inCall) {
        setError(null);
      }
    }
  }, [inCall, patchLoaded])

  // When the patch finished loading and error changes, pass its value to the patch
  useEffect(() => {
    if (patchLoaded) {
      CABLES.patch.setVariable('error', error ? true : false);
    }
  }, [error, patchLoaded])

  /* Handlers for user interaction */

  // Handle the user initiating the call
  const handleOrbClick = () => {
    if (patchLoaded && !inCall) {
      setError(null);
      requestMatch();
    }
    else if (patchLoaded && inCall) {
      leaveCall();
    }

    if (message) {
      setMessage('');
      CABLES.patch.setVariable('orbHovered', false);
    }
  };

  // When the patch finished loading, and the user hovers the orb
  const handleMouseOver = () => {
    if (patchLoaded) {
      CABLES.patch.setVariable('orbHovered', true);
    }
    if (patchLoaded && !inCall) {
      setMessage('Call a stranger?');
    }
    else if (patchLoaded && inCall) {
      setMessage('Leave call?');
    }
  }

  // When the patch finished loading, and the user stops hovering the orb
  const handleMouseOut = () => {
    if (patchLoaded) {
      CABLES.patch.setVariable('orbHovered', false);
    }
    if (message) {
      setMessage('');
    }
  }

  // When the user clicks the mode selector button
  const handleModeSelectorClick = () => {
    // Toggle the darkMode variable (weird hack)
    setDarkMode(!darkMode);
    // When the patch finished loading
    if (patchLoaded) {
      // Pass the value of darkMode to the patch
      CABLES.patch.setVariable('darkMode', !darkMode);
    }
  }

  /* Render component  */

  return (
    <>
      <canvas id={canvasId}></canvas>
      <div className='click-box-wrapper'>
        <div className='click-box' onClick={handleOrbClick} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}></div>
      </div>
      <div className='mode-selector clickable' data-value={darkMode} onClick={handleModeSelectorClick}>{darkMode ? 'Light Mode' : 'Dark Mode'}</div>
      <p><br/>{message}</p>
    </>
  );
}

export default CablesPatch;