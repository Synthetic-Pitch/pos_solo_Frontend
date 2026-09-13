import { useNavigate } from "react-router-dom";
import { useLoginStore } from "../stores/use-login-store";

const Overview = () => {
  const navigate = useNavigate();
  const currentSold = useLoginStore((state)=>state.loginResponse)
  return (
    <div>
        <button className="flex" onClick={()=>navigate("/order")}>
            <h3 className="bg-[#b1b2b5] text-white pr-20 pl-9 text-3xl py-8 rounded-br-full font-poppins" >back</h3>
        </button>
        <button onClick={()=>console.log(currentSold?.stores_default.flavors)
        }>click</button>
    </div>
  )
}

export default Overview;
