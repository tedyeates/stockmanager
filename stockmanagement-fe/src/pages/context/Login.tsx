import { createContext, useContext, useRef, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';

import { Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import { ErrorState, hasError, Error } from '../popup/Errors';
import { Requests } from 'util/requests';

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://github.com/tedyeates/">
        Ted Yeates
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

type AuthHeaderType = {
    Authorization: string
}

type AuthContextType = {
    user: any
    signin: (user: string, token: string, callback: VoidFunction) => void
    getToken: () => string | null
    authHeader: {current: AuthHeaderType | undefined}
    signout: (callback: VoidFunction) => void
    clearToken: () => void
}
  
export let AuthContext = createContext<AuthContextType>(null!)

  
export function AuthProvider({ children }: { children: React.ReactNode }) {
    let [user, setUser] = useState<string|null>(null)
    let authHeader = useRef<AuthHeaderType>()
    let token = useRef<string>()

    function generateAuthHeader(newToken: string | null) {
        if(newToken && newToken !== token.current){
            token.current = newToken
            authHeader.current = {
                'Authorization': `Token ${newToken}`
            }
        }
    }
    
    function getToken() {
        let storedToken = sessionStorage.getItem("token")
        generateAuthHeader(storedToken)

        return storedToken
    }

    function clearToken() {
        sessionStorage.removeItem("token")
        setUser(null)
        window.location.reload()
    }

    function signin(newUser: string, newToken: string, callback: VoidFunction){
        sessionStorage.setItem("token", newToken)
        console.log(newToken)
        console.log(newUser)
        setUser(newUser)
        generateAuthHeader(newToken)

        callback()
    }


    function signout(callback: VoidFunction){
        sessionStorage.setItem("token", '')
        setUser(null)
        callback()
    }
  
    let value = { user, signin, getToken, authHeader, signout, clearToken }
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
    return useContext(AuthContext);
}

export function RequireAuth({ children }: { children: JSX.Element }) {
    let auth = useAuth();
    let location = useLocation();
    
    if (!auth.getToken()) {
      // Redirect them to the /login page, but save the current location they were
      // trying to go to when they were redirected. 
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  
    return children;
}

type LocationState = {
    from: { pathname: string }
} | undefined


export function Login() {
    let navigate = useNavigate() 
    let location = useLocation()
    let auth = useAuth()

    const [errors, setErrors] = useState<ErrorState>()

    let state = location.state as LocationState
    let path = state?.from?.pathname || "/";

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))

        console.log(data)

        try {            
            const response = await Requests.post(
                `${process.env.REACT_APP_BASE_URL}/login/`, 
                data
            )
            auth.signin(response.username, response.token, () => {
                navigate(path, { replace: true })
            })
        } catch (e: any) {
            if (e?.response?.data) setErrors(e.response.data)
        }

    }

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            <CssBaseline />
            <Grid
                item
                xs={false}
                sm={4}
                md={7}
                sx={{
                    backgroundImage: 'url(https://source.unsplash.com/random)',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: (t) =>
                    t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
            <Box
                sx={{
                my: 8,
                mx: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <Error
                    fieldName="non_field_errors"
                    errors={errors ?? {}}
                />
                <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        error={hasError(errors, 'username')}
                        helperText={
                            hasError(errors, 'username') ? errors?.username[0] : ""
                        }
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                    />
                    <TextField
                        error={hasError(errors, 'password')}
                        helperText={
                            hasError(errors, 'password') ? errors?.password[0] : ""
                        }
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign In
                    </Button>
                    {/* <Grid container>
                        <Grid item xs>
                            <Link href="#" variant="body2">
                                Forgot password?
                            </Link>
                        </Grid>
                        <Grid item>
                            <Link href="#" variant="body2">
                                {"Don't have an account? Sign Up"}
                            </Link>
                        </Grid>
                    </Grid> */}
                    <Copyright sx={{ mt: 5 }} />
                </Box>
            </Box>
            </Grid>
        </Grid>
    )
}