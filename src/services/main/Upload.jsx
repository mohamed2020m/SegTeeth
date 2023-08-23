import {useRef } from 'react'
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import { useEffect, useState } from 'react';
import { FileAxis3d, UploadCloud } from 'lucide-react';
// import { Loader } from './../../components/Loader';
import ThreeDRenderer from '../../components/ThreeDRenderer';
import {AiOutlineArrowLeft} from "react-icons/ai";
import {AiOutlineFullscreen} from "react-icons/ai";
import {AiOutlineFullscreenExit} from 'react-icons/ai';
import {FaDownload} from 'react-icons/fa';
import HashLoader from "react-spinners/HashLoader";

function VTKViewer() {
  const formRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileBlob, setFileBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicted, setIsPredicted] = useState(false);
  const [data, setData] = useState(null)
  const [hideParts, setHidePars] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const headerElement = document.querySelector('.header');
    const footerElement = document.querySelector('.footer');
    if (headerElement) {
      headerElement.style.display = 'none';
    }
    if(footerElement){
      footerElement.style.display = 'none';
    }
  }, [])

  const handleUpload = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);

      console.log('Starting Segmentation...');

      const formData = new FormData(event.target);
      const response = await fetch('http://127.0.0.1:8000/api/v1/predict/post_processing', {
        method: 'POST',
        body: formData,
      });

      const jsonData = await response.json();
      setData(jsonData)
      const objData = jsonData.prediction_file;

      const blob = new Blob([objData], { type: 'text/xml' });
      const vtpFilePath = URL.createObjectURL(blob);

      loadVTPTest(vtpFilePath);
      setIsLoading(false);
    } catch(err){
      console.err("Error");
      setError(err)
      setIsLoading(false);
    }
  };


  const loadVTPTest = (objData) => {
    const vtkRenderScreen = vtkFullScreenRenderWindow.newInstance({
        container: document.querySelector('#vtk-container'),
        background: [0.118, 0.161, 0.231]
    });
    
    // Create a VTP reader
    const reader = vtkXMLPolyDataReader.newInstance();

    // console.log(objData);
  
    reader.setUrl(objData);
    
    reader.loadData().then(() => {
  
        // Get the VTP output data
        const vtpOutput = reader.getOutputData();
        
        // Get the materialid array from the VTP data
        // const materialidArray = vtpOutput.getCellData().getArrayByName('MaterialIds');
        const materialidArray = vtpOutput.getCellData().getArrayByName("Label");
  
        // Map scalar array through the lookup table
        materialidArray.setName("Scalars"); // Make sure the array has a name
        vtpOutput.getCellData().setScalars(materialidArray);
  
        // console.log("materialidArray.getData(): ", materialidArray.getData())
  
        // Create a color transfer function
        const colorTransferFunction = vtkColorTransferFunction.newInstance();
        
        // Create colors for 15 different classes (you can adjust these)
        const classColors = [
            [0.878, 0.878, 0.878],
            [0.839, 0.153, 0.157],  // Red
            [0.121, 0.466, 0.705],  // Blue
            [0.172, 0.627, 0.172],  // Green
            [0.580, 0.404, 0.741],  // Purple
            [1.000, 0.498, 0.054],  // Orange
            [0.890, 0.467, 0.761],  // Pink
            [0.498, 0.498, 0.498],  // Gray
            [0.737, 0.741, 0.133],  // Yellow
            [0.090, 0.745, 0.811],  // Teal
            [0.682, 0.780, 0.909],  // Light Blue
            [0.090, 0.745, 0.172],  // Bright Green
            [0.831, 0.607, 0.101],  // Gold
            [0.647, 0.380, 0.094],  // Brown
            [0.596, 0.306, 0.639],  // Dark Purple
            [0.180, 0.180, 0.180]   // Dark Gray
        ];
  
        
        const uniqueMaterialIds = new Set(materialidArray.getData());
        const numColors = classColors.length;
  
        uniqueMaterialIds.forEach((materialid, index) => {
            // Normalize the index based on the unique material IDs
            const normalizedIndex = index / (uniqueMaterialIds.size - 1);
  
            // Calculate the color index and wrap around within the valid range
            const colorIndex = Math.floor(normalizedIndex * numColors) % numColors;
  
            const color = classColors[colorIndex];
            colorTransferFunction.addRGBPoint(materialid, color[0], color[1], color[2]);
        });
        
        // Apply symmetric colorization
        
  
        // Create mapper and actor
        const mapper = vtkMapper.newInstance();
        mapper.setInputData(reader.getOutputData());
        mapper.setLookupTable(colorTransferFunction);
  
        mapper.setUseLookupTableScalarRange(true); // Ensure correct scalar range
  
        // Map scalars through the lookup table
        mapper.setScalarModeToUseCellData();
        mapper.setScalarVisibility(true);
  
        mapper.setColorModeToMapScalars(); // Map colors based on the materialid values
        
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);
        
        // create orientation widget
        const axes  = vtkAxesActor.newInstance();
        const orientationWidget = vtkOrientationMarkerWidget.newInstance({
                actor: axes,
                interactor: vtkRenderScreen.getRenderWindow().getInteractor(),
            });
            orientationWidget.setEnabled(true);
            orientationWidget.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
        );
  
        orientationWidget.setViewportSize(0.15);
        orientationWidget.setMinPixelSize(100);
        orientationWidget.setMaxPixelSize(300);
  
        vtkRenderScreen.getRenderer().addActor(actor);
        vtkRenderScreen.getRenderer().resetCamera();
        
        //Start rendering
        vtkRenderScreen.getRenderWindow().render();
        
        setIsPredicted(true);
        setIsLoading(false);
    });
  }

  const hanldeDownloadVtpFile = () => {
    const objContent = data.prediction_file;

    const blob = new Blob([objContent], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename
    document.body.appendChild(a);
    a.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  const handleBackBtn = () => {
    setFile(null)
    setFileBlob(null)
    setIsPredicted(null)
    setHidePars(false)
    document.querySelector("#vtk-container").innerHTML = null;
  }

  const handleResizeWindow = () => {
    const headerElement = document.querySelector('.header');
    const footerElement = document.querySelector('.footer');
    console.log(hideParts)
    setHidePars(!hideParts);
    console.log(hideParts)
    if(!hideParts){
      if (headerElement) {
        headerElement.style.display = 'none';
      }
      if(footerElement){
        footerElement.style.display = 'none';
      }
    }else{
      if(headerElement) {
        headerElement.style.display = 'block';
      }
      if(footerElement){
        footerElement.style.display = 'block';
      }
    }
  }

  const handlePredictBtn = () => {
    if (formRef.current) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      formRef.current.dispatchEvent(submitEvent);
    }
    setFile(null);
  };

  return (
    <>    
      <div className={`w-full h-screen scroll-smooth bg-slate-800 ${!isLoading && !isPredicted && !file ? 'block' : 'hidden'}`}>
        <div className='p-3 m-4 flex justify-end'>
          <button 
            className='text-white'
            onClick={handleResizeWindow}  
          >
            {hideParts ?
            <AiOutlineFullscreenExit/>
            :
            <AiOutlineFullscreen/>
          }
          </button>
        </div>
        <div className="text-center flex-box flex-col">
          <div className="text-white p-12 text-3xl font-semibold text-center">
            Please choose a file to upload to start the prediction
          </div>
          <div>  
            <div className="bg-slate-700 flex-box flex-col md:flex-row w-full md:px-10 rounded-md w-[300px] md:w-[500px] ">
              <form ref={formRef} id="upload-form" onSubmit={handleUpload} className="w-full p-0">
                <div className="w-full py-12 file flex-box flex-col">
                  <label
                    htmlFor="3d_file"
                    className="flex-box flex-col p-3 my-auto text-center hover:bg-slate-300 hover:text-slate-800"
                  >
                    <UploadCloud size={28} strokeWidth={2.5} />
                    <p>Click to upload or drag and drop</p>
                  </label>
                  <input
                    className="3d-file"
                    type="file" 
                    name="file"
                    accept=".obj"
                    onChange={(e) => {
                      setFileBlob(e.target.files[0])
                      setFile(e.target.files[0].name);
                    }}
                    id="3d_file"
                  />
                  <input type="submit" id="hidden-submit" style={{ display: 'none' }} />
                  <div className="fileName text-white">
                    <p className="bg-slate-800 py-4 md🛫 px-8 rounded-xl font-normal text-slate-300"><FileAxis3d width={18} style={{display: 'inline-block'}}/> Uploaded file: <span className="font-semibold text-white">{file ? file : "None"}</span></p>
                  </div>
                  <div className="text-center pt-8 text-slate-100 text-xl font-semibold">
                    Supported files
                  </div>
                  <div className="text-center text-slate-300 text-md py-3">
                    OBJ, STL, PLY, VTP, GLB, GLTG, FBX
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {file && 
      <div className='w-full h-screen scroll-smooth bg-slate-800'>
        <div className='p-3 m-4 flex justify-between'>
          <button 
            className="bg-slate-300 hover:bg-slate-500 hover:text-white px-3 py-1 rounded" 
            onClick={handleBackBtn}
          >
            <div className='flex items-center'>
            <AiOutlineArrowLeft />
            Back
            </div>
          </button>
          <button 
            className='text-white'
            onClick={handleResizeWindow}  
          >
            {hideParts ?
             <AiOutlineFullscreenExit/>
             :
             <AiOutlineFullscreen/>
          }
          </button>
        </div>
        <div className='text-center my-3'>
          <button 
            onClick={handlePredictBtn} 
            // type="submit" form="upload-form"
            className="px-10 py-3.5 my-4 bg-slate-500 hover:bg-slate-400 text-center text-white text-base font-semibold leading-tight mx-2 rounded-lg">
              Start Prediction
          </button>
        </div>
        <div className="text-center flex-box flex-col">
            <ThreeDRenderer file={fileBlob} />
        </div>
      </div>
      }

      {isLoading ? 
        <div className="p-8 w-full h-screen w-full flex-box bg-slate-700">
          {/* <Loader /> */}
          <div className='flex flex-col items-center'>
            <div>
              <HashLoader color="#36d7b7" />
            </div>
            <div>
              <p className="text-md text-slate-100">
                  TeethSeg is predicting...
              </p>
            </div>
          </div>
        </div>
      : null}
       
      <div className={`${isPredicted ? 'block' : 'hidden'} w-full h-screen scroll-smooth bg-slate-800`}>
        <div className='p-3 m-4 flex justify-between'>
          <button 
            className="bg-slate-300 hover:bg-slate-500 hover:text-white px-3 py-1 rounded" 
            onClick={handleBackBtn}
          >
            <div className='flex items-center'>
            <AiOutlineArrowLeft />
            Back
            </div>
          </button>
          <button 
            className='text-white'
            onClick={handleResizeWindow}  
          >
            {hideParts ?
            <AiOutlineFullscreenExit/>
            :
            <AiOutlineFullscreen/>
          }
          </button>
        </div>
        
        <div className='flex justify-center mb-3'>
          <button 
                onClick={hanldeDownloadVtpFile} 
                // type="submit" 
                className="px-10 py-4 bg-slate-500 hover:bg-slate-400 text-center text-white text-base font-semibold leading-tight mx-2 rounded-lg"
              >
                <div className='flex items-center'>
                  <FaDownload/>
                  <span className='mx-1'>Donwload Predicted File</span>
                </div>
          </button> 
        </div>

        {/* <div className="flex justify-center flex-box flex-col relative">
        </div>  
         */}
        <div className="text-white text-3xl font-semibold text-center">
          Predicted segmentation:
        </div>

      </div>
      <div id="vtk-container" className='w-full'></div>
    </>
  );
}

export default VTKViewer;