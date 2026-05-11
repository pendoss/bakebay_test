'use client'

import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Search, X} from 'lucide-react'

interface CatalogSearchBarProps {
    value: string
    onChange: (value: string) => void
}

export function CatalogSearchBar({value, onChange}: CatalogSearchBarProps) {
    return (
        <div className='relative'>
            <Search
                className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none'/>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder='Найти товар — «медовик», «макаруны», «свадебный торт»…'
                className='pl-9 pr-10 h-11 text-base'
            />
            {value.length > 0 && (
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => onChange('')}
                    className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0'
                    aria-label='Очистить поиск'
                >
                    <X className='h-4 w-4'/>
                </Button>
            )}
        </div>
    )
}
