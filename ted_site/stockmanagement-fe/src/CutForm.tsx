import { ReactElement, Component, ChangeEvent, MouseEvent } from 'react'
import { TiPlus, TiMinus } from 'react-icons/ti';
import Divider from '@material-ui/core/Divider';

import { DataType, OnChangeType } from './util/types'
import { Error } from './Forms'

type CutFormSharedProps = {
    onChange: (event: ChangeEvent<HTMLInputElement>, value:number) => void
}

type CutFormProps = {
    itemData: {[key: number]: DataType}
    rowData: DataType
    onChange: OnChangeType
    errors: DataType
}

type CutFormInputProps = CutFormSharedProps & {
    value: number
    index: number
    type: string
    onUpdate: (event:MouseEvent<HTMLButtonElement>, updateSize: number) => void
}

function CutFormInput({onChange, index, value, type, onUpdate}:CutFormInputProps): ReactElement {
    
    function inputField(indexKey:string){
        return (
            <input 
                key={indexKey} 
                data-key={indexKey} 
                type="number"
                step={0.01}
                name="size"
                className='form-input cut-input'
                value={value}
                onChange={(event) => onChange(event, value)}
            />
        )
    }

    function generateInputFields(){
        let inputs:ReactElement[] = [inputField(index.toString())]
        if (type === 'SHEET')
            inputs.push(inputField(`${index.toString()}-2`))
        
        return inputs
    }
    
    return (
        <div>
            <label key={`label-${index}`} className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-first-name">
                Size
            </label>
            <div className="relative flex items-stretch">
                <div>
                    {generateInputFields()}
                </div>
                {type === 'BAR' || type === 'SHEET' ?
                    <div className="inline-block">
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
    sizes: number[]
    totalSize: number
    lockedPair: {
        current: number
        previous: number
    }
    decimalPlaces: number
}

type LockedPairType = {current: number, previous: number}
type SizeCutReturn = [
    number[], 
    number,
    LockedPairType
]

export class CutForm extends Component<CutFormProps, CutFormState> {
    constructor(props: CutFormProps){
        super(props)
        this.state = {
            sizes: [this.props.rowData['size']],
            totalSize: this.props.rowData['size'],
            lockedPair: {
                current: -1,
                previous: -1,
            },
            decimalPlaces: 2,
        }
        console.log("Cutform " + this.props.rowData)
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

    getNewSizes(value: number, index: number): SizeCutReturn {
        const numberOfSizes:number =  this.state.sizes.length
        const roundedValue:number = this.roundDecimalPlaces(value, -1)
        // 1 input just update size value
        if (numberOfSizes < 2) return [[roundedValue], roundedValue, {current: -1, previous: -1}]
        // If size too high and not a signal input don't update
        if (roundedValue > this.state.totalSize) 
            return [this.state.sizes, this.state.totalSize, this.state.lockedPair]

        // Only update locks if new input is being editted
        let newLockedPair:LockedPairType = this.getUpdatedLockedPair(index)
        
        const currentValue:number = this.state.sizes[index]
        let totalChange:number = this.roundDecimalPlaces(currentValue - roundedValue, 0)
        let editableSizes:number = this.numberEditableSizes(newLockedPair)

        let newSizes:number[] = this.state.sizes.map((previousValue, previousIndex) => {
            // Size being editted should only be editted with user change
            if (index === previousIndex) return roundedValue

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
                updateOptions.push(previousValue * -1)

            const updateValue:number = this.closestToZeroInList(...updateOptions)
            totalChange = this.roundDecimalPlaces(totalChange - updateValue, 0)

            return this.roundDecimalPlaces(previousValue + updateValue, 0)
        })

        return [newSizes, this.state.totalSize, newLockedPair]

    }

    enforceSameTotal(array:number[], totalRoundedDifference:number){
        const decimalShift:number = Math.pow(10, this.state.decimalPlaces)
        return array.map((value, index) => {
            const addedDifference:number = ((totalRoundedDifference > index/decimalShift) ? 1/decimalShift : 0)
            return this.roundDecimalPlaces(value, -1) + addedDifference
        })
    }

    onModifyCut(event: ChangeEvent<HTMLInputElement>) {
        const index:number = parseInt(event.target.getAttribute('data-key') ?? "0")
        const newValue:number = event.target.valueAsNumber || 0
        const [sizes, totalSize, lockedPair] = this.getNewSizes(newValue, index)

        this.props.onChange('size', 'text', sizes)
        this.setState({ 
            sizes: sizes,
            totalSize: totalSize,
            lockedPair: lockedPair,
        })
    }


    updateSizes(event: MouseEvent<HTMLButtonElement>, updateSize:number){
        event.preventDefault()
        const sizeLength:number = this.state.sizes.length + updateSize
        if (sizeLength < 1) return

        const dividedSize:number = this.state.totalSize / sizeLength
        const dividedSizeRounded:number = this.roundDecimalPlaces(dividedSize, -1)
        const sizeDifference:number = (dividedSize - dividedSizeRounded) * sizeLength
        
        let sizes:number[] = this.enforceSameTotal(
            [...Array(sizeLength).fill(dividedSize)],
            sizeDifference
        )
        
        this.props.onChange('size', 'text', sizes)
        this.setState({
            sizes: sizes,
            lockedPair: {current: -1, previous: -1}
        })
    }

    generateCutInputsWrapper(item_type:string): ReactElement {
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
                                    type={item_type}
                                    onChange={(event) => this.onModifyCut(event)}
                                    onUpdate={(event, updateSize) => this.updateSizes(event, updateSize)}
                                    value={size}
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
        const item_type = this.props.itemData[this.props.rowData.item]?.item_type
        console.log(item_type)
        return this.generateCutInputsWrapper(item_type)
    }
}