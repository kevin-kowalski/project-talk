import React, { useEffect } from 'react';

function CablesPatch({ analyzer, bufferLength, dataArray }: {analyzer: AnalyserNode | null, bufferLength: number, dataArray: Uint8Array | null}) {

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
        variables: {
          avgVolume: 0,
        },
        onPatchLoaded: patchInitialized,
        onFinishedLoading: patchFinishedLoading,
      });
    }

    function patchInitialized () {
      console.log(patchDir + ' initialized');
    }

    function patchFinishedLoading () {
      console.log(patchDir + ' finished loading');
    }
  }, [canvasId, patchDir]);

  useEffect(() => {
    const updateVolume = () => {
      if (analyzer && dataArray) {
        requestAnimationFrame(updateVolume);

        analyzer.getByteFrequencyData(dataArray);
        const avgVolume = dataArray.reduce((acc, curr) => acc + curr, 0) / bufferLength;
        CABLES.patch.setVariable("avgVolume", avgVolume);
      }
    };

    updateVolume();
  }, [analyzer, bufferLength, dataArray])

  return (
    <canvas id={canvasId} style={{ width: '600px', maxWidth: '95%', aspectRatio: '1' }}></canvas>
  );
}

export default CablesPatch;