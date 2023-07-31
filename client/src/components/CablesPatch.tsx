import React, { useEffect, useState } from 'react';

function CablesPatch({
  requestMatch,
  analyzerRemote,
  bufferLengthRemote,
  dataArrayRemote,
  inCall
}: {
  requestMatch: Function,
  analyzerRemote: AnalyserNode | null,
  bufferLengthRemote: number,
  dataArrayRemote: Uint8Array | null,
  inCall: Boolean
}) {

  const [patchLoaded, setPatchLoaded] = useState(false);

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
    }
  }, [patchLoaded])

  useEffect(() => {
    if (patchLoaded) {
      CABLES.patch.setVariable("inCall", inCall);
    }
  }, [inCall, patchLoaded])

  // Handle the user initiating the call
  const handleCallClick = () => {
    if (patchLoaded) {
      requestMatch();
    }
  };

  // Handle the user hovering over the orb
  const handleMouseOver = () => {
    if (patchLoaded) {
      CABLES.patch.setVariable("orbHovered", true);
    }
  }
  const handleMouseOut = () => {
    if (patchLoaded) {
      CABLES.patch.setVariable("orbHovered", false);
    }
  }

  return (
    <>
      <div className='click-box-wrapper'>
        <div className='click-box' onClick={handleCallClick} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}></div>
      </div>
      <canvas id={canvasId}></canvas>
    </>
  );
}

export default CablesPatch;