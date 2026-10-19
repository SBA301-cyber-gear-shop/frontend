import { Icon } from "../Icon";
import "./Empty.scss";

export function Empty({ title = "Chưa có dữ liệu", description, action }) {
  return (
    <div className="panel empty-state">
      <Icon name="bag" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export default Empty;
