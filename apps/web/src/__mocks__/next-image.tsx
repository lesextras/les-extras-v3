import type { ImgHTMLAttributes } from "react";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src?: string };
  alt: string;
  priority?: boolean;
  fill?: boolean;
  quality?: number;
};

function toSrc(src: ImageProps["src"]) {
  return typeof src === "string" ? src : src.src ?? "";
}

export default function Image({
  src,
  alt,
  priority: _priority,
  fill: _fill,
  quality: _quality,
  ...props
}: ImageProps) {
  return <img src={toSrc(src)} alt={alt} {...props} />;
}
