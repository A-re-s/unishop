import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetCategoriesQuery } from "@/entities/category/api/category-api";
import {
	useCreateListingMutation,
	useDeleteListingPhotoMutation,
	useUpdateListingMutation,
	useUploadListingPhotoMutation,
} from "@/entities/listing/api/listing-api";
import type {
	Listing,
	ListingCondition,
	ListingPhoto,
} from "@/entities/listing/model/types";
import {
	LISTING_CONDITION_LABELS,
	MAX_LISTING_PHOTOS,
} from "@/entities/listing/model/types";
import styles from "./listing-form.module.css";

interface StagedPhoto {
	id: string;
	file: File;
	previewUrl: string;
}

interface ListingFormProps {
	// Present in edit mode; absent when creating a new listing.
	listing?: Listing;
}

export function ListingForm({ listing }: ListingFormProps) {
	const navigate = useNavigate();
	const { data: categories } = useGetCategoriesQuery();
	const [createListing, { isLoading: isCreating }] = useCreateListingMutation();
	const [updateListing, { isLoading: isUpdating }] = useUpdateListingMutation();
	const [uploadPhoto] = useUploadListingPhotoMutation();
	const [deletePhoto] = useDeleteListingPhotoMutation();

	const [title, setTitle] = useState(listing?.title ?? "");
	const [description, setDescription] = useState(listing?.description ?? "");
	const [price, setPrice] = useState(listing?.price ?? "");
	const [categoryId, setCategoryId] = useState(listing?.category_id ?? "");
	const [condition, setCondition] = useState<ListingCondition>(
		listing?.condition ?? "used",
	);

	const [existingPhotos, setExistingPhotos] = useState<ListingPhoto[]>(
		listing?.photos ?? [],
	);
	const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const stagedPhotosRef = useRef(stagedPhotos);
	stagedPhotosRef.current = stagedPhotos;
	useEffect(() => {
		return () => {
			for (const photo of stagedPhotosRef.current) {
				URL.revokeObjectURL(photo.previewUrl);
			}
		};
	}, []);

	const totalPhotoCount = listing ? existingPhotos.length : stagedPhotos.length;
	const canAddMorePhotos = totalPhotoCount < MAX_LISTING_PHOTOS;

	async function addFiles(fileList: FileList | File[]) {
		const files = Array.from(fileList).filter((file) =>
			file.type.startsWith("image/"),
		);
		const room = MAX_LISTING_PHOTOS - totalPhotoCount;
		const toAdd = files.slice(0, room);
		if (toAdd.length === 0) {
			return;
		}

		if (listing) {
			setIsUploadingPhoto(true);
			for (const file of toAdd) {
				try {
					const photo = await uploadPhoto({
						listingId: listing.id,
						file,
					}).unwrap();
					setExistingPhotos((prev) => [...prev, photo]);
				} catch {
					setError("Не удалось загрузить одно из фото.");
				}
			}
			setIsUploadingPhoto(false);
		} else {
			setStagedPhotos((prev) => [
				...prev,
				...toAdd.map((file) => ({
					id: crypto.randomUUID(),
					file,
					previewUrl: URL.createObjectURL(file),
				})),
			]);
		}
	}

	async function handleRemoveExistingPhoto(photoId: string) {
		if (!listing) {
			return;
		}
		await deletePhoto({ listingId: listing.id, photoId }).unwrap();
		setExistingPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
	}

	function handleRemoveStagedPhoto(id: string) {
		setStagedPhotos((prev) => {
			const target = prev.find((photo) => photo.id === id);
			if (target) {
				URL.revokeObjectURL(target.previewUrl);
			}
			return prev.filter((photo) => photo.id !== id);
		});
	}

	function handleDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();
		if (event.dataTransfer.files.length > 0) {
			addFiles(event.dataTransfer.files);
		}
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const values = {
			title: title.trim(),
			description: description.trim(),
			price: price.trim(),
			category_id: categoryId,
			condition,
		};

		try {
			if (listing) {
				await updateListing({ id: listing.id, data: values }).unwrap();
				navigate(`/listings/${listing.id}`);
			} else {
				const created = await createListing(values).unwrap();
				for (const staged of stagedPhotos) {
					try {
						await uploadPhoto({
							listingId: created.id,
							file: staged.file,
						}).unwrap();
					} catch {
						// Listing was created successfully — a failed photo isn't fatal.
					}
				}
				navigate(`/listings/${created.id}`);
			}
		} catch {
			setError(
				"Не удалось сохранить объявление. Проверьте поля и попробуйте снова.",
			);
			setIsSubmitting(false);
		}
	}

	const isSaving = isCreating || isUpdating || isSubmitting;

	return (
		<form className={styles.form} onSubmit={handleSubmit}>
			{error && <p className={styles.error}>{error}</p>}

			<label className={styles.field}>
				<span>Название</span>
				<input
					type="text"
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					required
					maxLength={255}
				/>
			</label>

			<label className={styles.field}>
				<span>Описание</span>
				<textarea
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					required
					rows={5}
				/>
			</label>

			<div className={styles.row}>
				<label className={styles.field}>
					<span>Цена, ₽</span>
					<input
						type="number"
						min="0.01"
						step="0.01"
						value={price}
						onChange={(event) => setPrice(event.target.value)}
						required
					/>
				</label>

				<label className={styles.field}>
					<span>Категория</span>
					<select
						value={categoryId}
						onChange={(event) => setCategoryId(event.target.value)}
						required
					>
						<option value="" disabled>
							Выберите категорию
						</option>
						{categories?.map((category) => (
							<option key={category.id} value={category.id}>
								{category.name}
							</option>
						))}
					</select>
				</label>

				<label className={styles.field}>
					<span>Состояние</span>
					<select
						value={condition}
						onChange={(event) =>
							setCondition(event.target.value as ListingCondition)
						}
					>
						{Object.entries(LISTING_CONDITION_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className={styles.field}>
				<span>
					Фото ({totalPhotoCount}/{MAX_LISTING_PHOTOS})
				</span>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: drag&drop is a progressive enhancement — the file input below is the accessible fallback */}
				<div
					className={styles.dropzone}
					onDragOver={(event) => event.preventDefault()}
					onDrop={handleDrop}
				>
					<p>Перетащите фото сюда или</p>
					<label className={styles.fileLabel}>
						выберите файлы
						<input
							type="file"
							accept="image/*"
							multiple
							hidden
							disabled={!canAddMorePhotos || isUploadingPhoto}
							onChange={(event) => {
								if (event.target.files) {
									addFiles(event.target.files);
								}
								event.target.value = "";
							}}
						/>
					</label>
				</div>

				{(existingPhotos.length > 0 || stagedPhotos.length > 0) && (
					<div className={styles.photoGrid}>
						{listing
							? existingPhotos.map((photo) => (
									<div key={photo.id} className={styles.photoThumb}>
										<img src={photo.url} alt="" />
										<button
											type="button"
											onClick={() => handleRemoveExistingPhoto(photo.id)}
											aria-label="Удалить фото"
										>
											×
										</button>
									</div>
								))
							: stagedPhotos.map((photo) => (
									<div key={photo.id} className={styles.photoThumb}>
										<img src={photo.previewUrl} alt="" />
										<button
											type="button"
											onClick={() => handleRemoveStagedPhoto(photo.id)}
											aria-label="Удалить фото"
										>
											×
										</button>
									</div>
								))}
					</div>
				)}
			</div>

			<button type="submit" className={styles.submit} disabled={isSaving}>
				{listing ? "Сохранить изменения" : "Опубликовать объявление"}
			</button>
		</form>
	);
}
