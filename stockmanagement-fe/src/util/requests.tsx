enum Method {
    GET='GET',
    POST='POST',
    PUT='PUT',
    DELETE='DELETE'
}

export class RequestError extends Error {
    status: number
    responseData: any

    constructor(status: number, responseData: any) {
        super(`Request Error ${status}`)
        this.status = status
        this.responseData = responseData
    }
}

export class Requests {
    static request = async (
        url: string, 
        method: Method, 
        headers: HeadersInit | null=null,
        data: BodyInit | null=null
    ) => {
        const response =  await fetch(
            url,
            {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    ...headers
                },
                body: data
            }
        )
        if (!response.ok) {
            let responseData: any = null
            try { responseData = await response.json() } catch {}
            throw new RequestError(response.status, responseData)
        }
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