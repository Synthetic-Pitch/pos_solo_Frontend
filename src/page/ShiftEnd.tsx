import { useEffect } from 'react'
import shiftendPic from "../assets/image/endshift.png";
import { resetPersistedClientState } from '../utils/revenue'

const ShiftEnd = () => {
  useEffect(() => {
    resetPersistedClientState()
  }, [])

  return (
    <div className="flex flex-col justify-center items-center h-screen text-2xl font-poppins">
        <img src={shiftendPic} alt="shiftend" />
        <p className="text-center">thank you for your service,</p>
        <p className="text-center">Bukas Ulit!</p>
    </div>
  )
}

export default ShiftEnd;