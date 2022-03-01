import * as React from "react";
import { Redirect, useHistory } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingPage from "../components/LoadingPage";
import { useFeatureFlags } from "../hooks/featureflags";
import { AppContext } from "./AppContext";

const USER_INFO = "/oauth2/userinfo";
const SIGN_IN = "/oauth2/sign_in";
const LOG_OUT = "/oauth2/logout";
const AUTH_PATH_SIGNIN = "/sign_in";

export const AuthCheck = ({ children }) => {
  // If the auth flag is null go straight to rendering the children
  const flags = useFeatureFlags();

  if (!flags?.WEAVE_GITOPS_AUTH_ENABLED) {
    return children;
  }

  const { loading, userInfo } = React.useContext(Auth);

  // Wait until userInfo is loaded before showing signin or app content
  if (loading) {
    return (
      <Layout>
        <LoadingPage />
      </Layout>
    );
  }

  // Signed in! Show app
  if (userInfo?.email) {
    return children;
  }

  // User appears not be logged in, off to signin
  return <Redirect to={AUTH_PATH_SIGNIN} />;
};

export type AuthContext = {
  signIn: (data: any) => void;
  userInfo: {
    email: string;
    groups: string[];
  };
  error: { status: number; statusText: string };
  loading: boolean;
  logOut: () => void;
};

export const Auth = React.createContext<AuthContext | null>({} as AuthContext);

export default function AuthContextProvider({ children }) {
  const { request } = React.useContext(AppContext);
  const flags = useFeatureFlags();

  const [userInfo, setUserInfo] =
    React.useState<{
      email: string;
      groups: string[];
    }>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState(null);
  const history = useHistory();

  const signIn = React.useCallback((data) => {
    setLoading(true);
    request(SIGN_IN, {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.status !== 200) {
          setError(response);
          return;
        }
        getUserInfo().then(() => history.push("/"));
      })
      .finally(() => setLoading(false));
  }, []);

  const getUserInfo = React.useCallback(() => {
    setLoading(true);
    return request(USER_INFO)
      .then((response) => {
        if (response.status === 400 || response.status === 401) {
          setUserInfo(null);
          return;
        }
        return response.json();
      })
      .then((data) => setUserInfo({ email: data?.email, groups: [] }))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [flags]);

  const logOut = React.useCallback(() => {
    setLoading(true);
    request(LOG_OUT, {
      method: "POST",
    })
      .then((response) => {
        if (response.status !== 200) {
          setError(response);
          return;
        }
        history.push("/sign_in");
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (!flags.WEAVE_GITOPS_AUTH_ENABLED) {
      return null;
    }
    getUserInfo();
    return history.listen(getUserInfo);
  }, [flags, getUserInfo, history]);

  return (
    <>
      {flags.WEAVE_GITOPS_AUTH_ENABLED ? (
        <Auth.Provider
          value={{
            signIn,
            userInfo,
            error,
            loading,
            logOut,
          }}
        >
          {children}
        </Auth.Provider>
      ) : (
        children
      )}
    </>
  );
}
