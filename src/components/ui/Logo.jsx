import { Link } from "react-router-dom";
import { Icon } from "./Icon";

export function Logo() {
  return (
    <Link to="/cua-hang" className="logo" aria-label="TechZone Pro - Cửa hàng">
      <span>
        <Icon name="chip" />
      </span>
      <div>
        TECH<span className="red">ZONE</span>
        <sup>PRO</sup>
        <small>PC & LINH KIỆN</small>
      </div>
    </Link>
  );
}
