import { Component } from "react";
import { Empty } from "../Empty";
import { Button } from "../Button";

export class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <main className="wrap main">
          <Empty
            title="Trang chưa tải được"
            description="Dữ liệu đã lưu vẫn còn trên thiết bị. Hãy tải lại để thử tiếp."
            action={
              <Button onClick={() => window.location.reload()}>Tải lại</Button>
            }
          />
        </main>
      );
    return this.props.children;
  }
}
