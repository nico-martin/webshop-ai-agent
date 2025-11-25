import React from "react";
import { useSearchParams } from "react-router";

import { CATEGORIES, COLORS, SIZES } from "../../store/products.ts";
import { Checkbox } from "../../theme";

const ProductFilterElement: React.FC<{
  className?: string;
  type: "categories" | "colors" | "sizes";
}> = ({ className = "", type }) => {
  const filter: {
    name: string;
    options: Array<{ value: string; name: string }>;
  } = React.useMemo(() => {
    return {
      name:
        type === "categories"
          ? "Categories"
          : type === "colors"
            ? "Colors"
            : type === "sizes"
              ? "Sizes"
              : "unknown",
      options: Object.entries(
        type === "categories"
          ? CATEGORIES
          : type === "colors"
            ? COLORS
            : type === "sizes"
              ? SIZES
              : {}
      ).map(([value, name]) => ({
        value,
        name: typeof name === "string" ? name : name.label,
      })),
    };
  }, [type]);

  const [searchParams, setSearchParams] = useSearchParams();
  const checked = searchParams.getAll(type);

  const setChecked = (updater: (prev: string[]) => string[]) => {
    const newValues = updater(checked);
    setSearchParams((params) => {
      const newParams = new URLSearchParams(params);
      newParams.delete(type);
      newValues.forEach((value) => newParams.append(type, value));
      return newParams;
    });
  };

  return (
    <div className={className}>
      <fieldset>
        <legend className="block text-sm font-medium text-gray-900">
          {filter.name}
        </legend>
        <div className="space-y-3 pt-6">
          {filter.options.map(({ value, name }) => (
            <Checkbox
              key={value}
              value={value}
              id={`${type}-${value}`}
              name={`${type}[]`}
              checked={checked.includes(value)}
              onChange={(checked) =>
                setChecked((prev) =>
                  checked ? [...prev, value] : prev.filter((v) => v !== value)
                )
              }
              label={name}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
};

export default ProductFilterElement;
