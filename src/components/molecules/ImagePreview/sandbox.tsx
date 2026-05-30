import { Text } from '../../atoms'
import { ImagePreview } from './ImagePreview'

export const ImagePreviewSandbox = () => {
  return (
    <div className="flex flex-col gap-5">
      <Text as="h3">Image Preview</Text>

      <Text as="h4">Static</Text>
      <div className="flex gap-5 ">
        <ImagePreview
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLFN4dj4RXNyA8A67wd7CZnj-xuYdg9JGbHw&s"
          alt="img"
          height="60px"
          width="60px"
        />
        <ImagePreview
          src="https://logos-world.net/wp-content/uploads/2020/09/Pinterest-Logo.png"
          alt="img"
          height={200}
          width="auto"
        />
        <ImagePreview
          src="https://media.istockphoto.com/id/501151256/photo/slice-of-water.jpg?s=612x612&w=is&k=20&c=zhjG2WxridNIf_XoLygxORDqF2sHhsSJKmHqRKfLiU4="
          alt="img"
          width="100px"
        />
      </div>

      <Text as="h4">Expandable</Text>
      <div className="flex gap-5">
        <ImagePreview
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLFN4dj4RXNyA8A67wd7CZnj-xuYdg9JGbHw&s"
          alt="img"
          height="60px"
          width="60px"
          allowExpand
        />
        <ImagePreview
          src="https://logos-world.net/wp-content/uploads/2020/09/Pinterest-Logo.png"
          alt="img"
          height="60px"
          width="60px"
          allowExpand
        />
        <ImagePreview
          src="https://media.istockphoto.com/id/501151256/photo/slice-of-water.jpg?s=612x612&w=is&k=20&c=zhjG2WxridNIf_XoLygxORDqF2sHhsSJKmHqRKfLiU4="
          alt="img"
          width="100px"
          allowExpand
        />
      </div>
    </div>
  )
}
