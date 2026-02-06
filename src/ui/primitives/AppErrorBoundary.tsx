import React from "react";
import { Text, View } from "react-native";

import { NeonButton } from "./NeonButton";
import { log } from "../../shared/utils/log";
import { theme } from "../theme/theme";

type AppErrorBoundaryState = {
  hasError: boolean;
};

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    log.error("Unhandled app error", { error, info });
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.bg,
            padding: theme.spacing(3),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 22,
              fontWeight: "700",
              marginBottom: theme.spacing(2),
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              color: theme.colors.muted,
              textAlign: "center",
              marginBottom: theme.spacing(3),
            }}
          >
            We hit an unexpected error. You can try to recover without closing
            the app.
          </Text>
          <NeonButton label="Try Again" onPress={this.handleReset} />
        </View>
      );
    }

    return this.props.children;
  }
}
