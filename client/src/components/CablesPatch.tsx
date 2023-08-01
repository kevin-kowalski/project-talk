import React, { useEffect, useState } from 'react';

function CablesPatch({
  requestMatch,
  leaveCall,
  analyzerRemote,
  bufferLengthRemote,
  dataArrayRemote,
  inCall,
  error,
  setError
}: {
  requestMatch: Function,
  leaveCall: Function,
  analyzerRemote: AnalyserNode | null,
  bufferLengthRemote: number,
  dataArrayRemote: Uint8Array | null,
  inCall: Boolean,
  error: {error: Boolean, message: String} | null,
  setError: Function
}) {

  const [patchLoaded, setPatchLoaded] = useState<Boolean>(false);
  const [darkMode, setDarkMode] = useState<Boolean>(true);
  const [message, setMessage] = useState<String | null>(null)

  const canvasId = "glcanvas";
  const patchDir = '/patch/';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = patchDir + '/js/patch.js';
    script.async = true;
    script.onload = initPatch;
    document.body.appendChild(script);

    return () => {
      // Cleanup function
      document.body.removeChild(script);
    }

    function initPatch () {
      CABLES.patch = new CABLES.Patch({
        patch: CABLES.exportedPatch,
        prefixAssetPath: patchDir,
        jsPath: patchDir + '/js',
        glCanvasId: canvasId,
        canvas: {'alpha': true, 'premultipliedAlpha': true},
        glCanvasResizeToWindow: true,
        onPatchLoaded: patchInitialized,
        onFinishedLoading: patchFinishedLoading,
      });
    }

    function patchInitialized () {
      console.log('Patch initialized');
    }

    function patchFinishedLoading () {
      console.log('Patch finished loading');
      setPatchLoaded(true);
    }
  }, [canvasId, patchDir]);

  useEffect(() => {
    const updateVolumeRemote = () => {
      if (analyzerRemote && dataArrayRemote) {
        requestAnimationFrame(updateVolumeRemote);

        analyzerRemote.getByteFrequencyData(dataArrayRemote);
        const avgVolume = dataArrayRemote.reduce((acc, curr) => acc + curr, 0) / bufferLengthRemote;
        CABLES.patch.setVariable("avgVolumeRemote", avgVolume);
      }
    };

    updateVolumeRemote();
  }, [analyzerRemote, bufferLengthRemote, dataArrayRemote])

  useEffect(() => {
    if (patchLoaded) {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      canvas.style.opacity = '1';

      const clickBox = document.querySelector('.click-box') as HTMLDivElement;
      clickBox.style.cursor = 'pointer';

      // Initialize dark mode variable on patch
      CABLES.patch.setVariable('darkMode', darkMode);
    }
  }, [patchLoaded])

  useEffect(() => {
    if (patchLoaded) {
      CABLES.patch.setVariable('inCall', inCall);
      if (!inCall) {
        setError(null);
      }
    }
  }, [inCall, patchLoaded])

  useEffect(() => {
    if (patchLoaded) {
      CABLES.patch.setVariable('error', error ? true : false);
    }
  }, [error, patchLoaded])

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

  // Handle the user hovering over the orb
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

  const handleMouseOut = () => {
    if (patchLoaded) {
      CABLES.patch.setVariable('orbHovered', false);
    }
    if (message) {
      setMessage('');
    }
  }

  // Handle the user clicking the mode selector button
  const handleModeSelectorClick = () => {
    setDarkMode(!darkMode);
    if (patchLoaded) {
      CABLES.patch.setVariable('darkMode', !darkMode);
    }
  }

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