import { ReactElement, Component, ChangeEvent, MouseEvent } from 'react'
import { TiPlus, TiMinus } from 'react-icons/ti';
import Divider from '@material-ui/core/Divider';

import { DataType, OnChangeType } from './util/types'
import { Error } from './Forms'

type CutFormSharedProps = {
    onChange: (event: ChangeEvent<HTMLInputElement>, sizeIndex: number) => void
}

type CutFormProps = {
    itemData: {[key: number]: DataType}
    rowData: DataType
    onChange: OnChangeType
    errors: DataType
    itemType: string | undefined | null
}

type CutFormInputProps = CutFormSharedProps & {
    value: number[]
    index: number
    type: string
    onUpdate: (event:MouseEvent<HTMLButtonElement>, updateSize: number) => void
}

function CutFormInput({onChange, index, value, type, onUpdate}:CutFormInputProps): ReactElement {
    
    function inputField(indexKey:string, index: number){
        return (
            <input 
                key={indexKey} 
                data-key={indexKey} 
                type="number"
                step={0.01}
                name="size"
                className='form-input cut-input'
                value={value[index] || ''}
                onChange={(event) => onChange(event, index)}
            />
        )
    }
    
    function generateInputFields(){
        let inputs:ReactElement[] = [inputField(index.toString(), 0)]
        if (type === 'SHEET')
            inputs.push(inputField(`${index.toString()}-2`, 1))

        return inputs
    }
    
    return (
        <div>
            <label key={`label-${index}`} className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-first-name">
                Size
            </label>
            <div className="relative flex items-stretch">
                <div className="inline-flex">
                    {generateInputFields()}
                </div>
                {type === 'BAR' || type === 'SHEET' ?
                    <div className="inline-flex">
                        <button className="cut-button" key={`plus-${index}`} onClick={event => onUpdate(event, 1)}>
                            <TiPlus/>
                        </button>
                        <button className="cut-button" key={`minus-${index}`} onClick={event => onUpdate(event, -1)}>
                            <TiMinus/>
                        </button>
                    </div>
                    :
                    <></>
                }
            </div>
        </div>
    )
}

type CutFormState = {
    sizes: number[][]
    sizeLength: number
    totalSize: number[]
    lockedPair: {
        current: number
        previous: number
    }
    decimalPlaces: number
}

type LockedPairType = {current: number, previous: number}
type SizeCutReturn = [
    number[][], 
    number[],
    LockedPairType
]

export class CutForm extends Component<CutFormProps, CutFormState> {
    constructor(props: CutFormProps){
        super(props)
        let sizeLength = this.sizeLength()

        this.state = {
            sizes: [this.props.rowData['size']] ?? [[]],
            sizeLength: sizeLength,
            totalSize: this.props.rowData['size']  ?? [],
            lockedPair: {
                current: -1,
                previous: -1,
            },
            decimalPlaces: 2,
        }
    }


    sizeLength(){
        if((this.props.itemType ?? '') === 'SHEET')
            return 2

        return 1
    }

    /**
     * Rounds number in direction chosen by round to state.decimalPlaces
     * @param number Number to round
     * @param round Round up or down, 1 up, -1 down, 0 round normally
     * @returns number rounded to number of decimal places found in state
     */
    roundDecimalPlaces(number: number, round:number): number {
        const decimalShift = Math.pow(10, this.state.decimalPlaces)

        if (round > 0) return Math.ceil(number * decimalShift) / decimalShift;
        if (round < 0) return Math.floor(number * decimalShift) / decimalShift;
        return Math.round(number * decimalShift) / decimalShift;
    }

    /**
     * Gets number of size fields based on if a previous value was editted or not
     * @param lockedPair Dictionary containing current editted value and previous editted value
     * @returns Number of size fields excluding previously and currently edditted field
     */
    numberEditableSizes(lockedPair:LockedPairType):number {
        if (lockedPair.previous > -1) return this.state.sizes.length - 2
        return this.state.sizes.length - 1
    }

    /**
     * Reduce function for checking which value has the smallest absolute value
     * @param accumulator Current smallest absolute value
     * @param currentValue Value to check against
     * @returns Smallest absolute value
     */
    closestToZero(accumulator:number, currentValue:number):number{
        if (Math.abs(currentValue) < Math.abs(accumulator)) return currentValue;
        return accumulator
    }

    /**
     * Reduce list to smallest absolute value
     * @param numbers List of numbers 
     * @returns Smallest absolute number in list
     */
    closestToZeroInList(...numbers:number[]):number {
        return numbers.reduce(this.closestToZero)
    }

    /**
     * Rounds negative numbers down and positive numbers up
     * @param number Number to round
     * @returns number rounded away from zero
     */
    roundFromZero(number: number):number{
        if (number < 0) return this.roundDecimalPlaces(number, -1);
        return this.roundDecimalPlaces(number, 1);
    }

    /**
     * If a new field is editted update current field and previous field
     * User can no update old previous locked field
     * @param index Number representing size field
     * @returns Current and previous editted indexes
     */
    getUpdatedLockedPair(index:number):LockedPairType {
        if (this.state.lockedPair.current !== index)
            return {current: index, previous: this.state.lockedPair.current}
        return this.state.lockedPair
    }

    /**
     * Distributes totalValueChange amongst editable fields 
     * and rounds to choosen decimal places in state
     * @param totalValueChange Number size field changed by
     * @param numberEditableSizes Number of sizes excluding locked fields
     * @returns Value changed divided between editable fields
     */
    distributeChange(totalValueChange:number, numberEditableSizes:number):number {
        return this.roundFromZero(
            totalValueChange / numberEditableSizes
        ) 
    }

    getNewSizes(value: number, index: number, sizeIndex:number): SizeCutReturn {
        const correctedLength = this.sizeLength()
        const sizeCorrectedSizes = this.state.sizes.map(size => size.slice(0, correctedLength))
        let sizeCorrectedTotal = this.state.totalSize.slice(0, correctedLength)
        const numberOfSizes:number =  sizeCorrectedSizes.length
        const roundedValue:number = this.roundDecimalPlaces(value, -1)
        const sizeRow:number[] = sizeCorrectedSizes[index]

        const totalSizeColumn:number = sizeCorrectedTotal[sizeIndex]

        if (numberOfSizes < 1) {
            sizeCorrectedTotal[sizeIndex] = 0
            return [sizeCorrectedSizes, sizeCorrectedTotal, {current: -1, previous: -1}]
        }
        // 1 input just update size value
        if (numberOfSizes < 2) {
            let sizes = sizeCorrectedSizes
            sizes[0][sizeIndex] = roundedValue 
            sizeCorrectedTotal[sizeIndex] = roundedValue
            return [sizes, sizeCorrectedTotal, {current: -1, previous: -1}]
        }

        // If size too high and not a signal input don't update
        if (roundedValue > totalSizeColumn) 
            return [sizeCorrectedSizes, sizeCorrectedTotal, this.state.lockedPair]

        // Only update locks if new input is being editted
        let newLockedPair:LockedPairType = this.getUpdatedLockedPair(index)
        
        const currentValue:number = sizeRow[sizeIndex]
        let totalChange:number = this.roundDecimalPlaces(currentValue - roundedValue, 0)
        let editableSizes:number = this.numberEditableSizes(newLockedPair)

        let newSizes:number[][] = sizeCorrectedSizes.map((previousValue, previousIndex) => {
            // Size being editted should only be editted with user change
            if (index === previousIndex) {
                previousValue[sizeIndex] = roundedValue
                return previousValue
            }

            let previousValueColumn = previousValue[sizeIndex]
            /* Don't update if total is already been alocated or if value is locked from editing
             * only lock if more than 2 fields (cannot allocated to remaining fields causes deadlock)
             */
            if (totalChange === 0 ||
                (newLockedPair.previous === previousIndex && numberOfSizes > 2)) {
                return previousValue
            }

            const distributedChange = this.distributeChange(totalChange, editableSizes--)
            
            /* Update size base on divided allocation
             * or remaining total if less left to allocate incase of even numbers that divide to odd numbers
             * or remove remaining value for input to prevent negative sizes
            */
            let updateOptions:number[] = [totalChange, distributedChange]
            if (totalChange < 0)
                updateOptions.push(previousValueColumn * -1)

            const updateValue:number = this.closestToZeroInList(...updateOptions)
            totalChange = this.roundDecimalPlaces(totalChange - updateValue, 0)

            previousValue[sizeIndex] = this.roundDecimalPlaces(previousValueColumn + updateValue, 0)
            return previousValue
        })

        return [newSizes, sizeCorrectedTotal, newLockedPair]

    }

    enforceSameTotal(array:number[], totalRoundedDifference:number){
        const decimalShift:number = Math.pow(10, this.state.decimalPlaces)
        return array.map((value, index) => {
            const addedDifference:number = ((totalRoundedDifference > index/decimalShift) ? 1/decimalShift : 0)
            return this.roundDecimalPlaces(value, -1) + addedDifference
        })
    }

    onModifyCut(event: ChangeEvent<HTMLInputElement>, sizeIndex:number) {
        const index:number = parseInt(event.target.getAttribute('data-key') ?? "0")
        const newValue:number = event.target.valueAsNumber || 0
        const [newSizes, newTotalSize, lockedPair] = this.getNewSizes(newValue, index, sizeIndex)

        this.props.onChange('size', 'number array', newSizes)

        this.setState({ 
            sizes: newSizes, 
            totalSize: newTotalSize,
            lockedPair: lockedPair,
        })
    }


    updateSizes(event: MouseEvent<HTMLButtonElement>, updateSize:number){

        event.preventDefault()
        const sizeCorrectedTotal = this.state.totalSize.slice(0, this.sizeLength())
        
        const sizeLength:number = this.state.sizes.length + updateSize
        if (sizeLength < 1) return 
        
        let dividedSizes = sizeCorrectedTotal.map((total, index) => {

            const dividedSize:number = total / sizeLength
            const dividedSizeRounded:number = this.roundDecimalPlaces(dividedSize, -1)
            const sizeDifference:number = (dividedSize - dividedSizeRounded) * sizeLength
            
            let newSizes:number[] = this.enforceSameTotal(
                [...Array(sizeLength).fill(dividedSize)],
                sizeDifference
            )
            
            this.props.onChange('size', 'text', newSizes)
            return newSizes
        })

        let replaceSizes = dividedSizes[0].map((_, colIndex) => {
            return dividedSizes.map(row => row[colIndex])
        })

        this.props.onChange('size', 'number array', replaceSizes)
        this.setState({
            sizes: replaceSizes,
            lockedPair: {current: -1, previous: -1}
        })
    }

    generateCutInputsWrapper(): ReactElement {
        return (
            <>
                <Divider variant="middle" />
                <br/>
                <div>
                    {this.state.sizes.map((size, index) => {
                        return (
                            <div key={index}>
                                <CutFormInput
                                    index={index}
                                    type={this.props.itemType ?? ''}
                                    onChange={(event, sizeIndex) => this.onModifyCut(event, sizeIndex)}
                                    onUpdate={(event, updateSize) => this.updateSizes(event, updateSize)}
                                    value={size ?? []}
                                />
                                <Error 
                                    fieldName='size'
                                    errors={this.props.errors}
                                />
                            </div>
                        )
                    })}
                </div>
            </>
        )
    }

    render(){
        return this.generateCutInputsWrapper()
    }
}