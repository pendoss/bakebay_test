import * as React from 'react'

interface Props {
    children?: string
}

export default function ReactMarkdown({children}: Props) {
    return <span>{children}</span>
}
