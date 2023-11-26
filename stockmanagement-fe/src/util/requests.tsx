enum Method {
    GET='GET',
    POST='POST',
    PUT='PUT',
    DELETE='DELETE'
}

export class Requests {
    static request = async (
        url: string, 
        method: Method, 
        headers: HeadersInit | null=null,
        data: BodyInit | null=null
    ) => {
        const response =  await fetch(
            `${process.env.REACT_APP_BASE_URL}/login`,
            {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    ...headers
                },
                body: data
            }
        )
        if (!response.ok) throw new Error(`Request Error ${response.status}: ${response.body}`)
        return await response.json()
    }
    static get = async (url: string, headers: HeadersInit | null=null) => {
        return await Requests.request(url, Method.GET, headers)
    }
    static post = async (
        url: string, 
        data: BodyInit,
        headers: HeadersInit | null=null
    ) => {
        return await Requests.request(url, Method.POST, headers, data)
    }
    static put = async (
        url: string, 
        data: BodyInit,
        headers: HeadersInit | null=null
    ) => {
        return await Requests.request(url, Method.PUT, headers, data)
    }
    static delete = async (url: string, headers: HeadersInit | null=null) => {
        return await Requests.request(url, Method.DELETE, headers)
    }
}